/**
 * Canvas layer state management for the Lens-based editor.
 *
 * v2 updates:
 * - Lens support (currentLens, lens palette, lens font)
 * - Metric binding per layer (boundMetricId)
 * - Expanded font/color properties per layer
 * - Lens-level font/color/palette overrides
 * - Undo preserves selection on undo
 * - History pushed on gesture END, not per frame
 */
import React, { createContext, useContext, useCallback, useState, useRef } from "react";

// ── Types ──

/** @deprecated Use shadow/blur/border booleans on CanvasLayer */
export type LayerBackground = 'none' | 'glass' | 'solid' | 'outlined';

export type CanvasRatio = "9:16" | "4:5" | "1:1";

export interface CanvasLayer {
  id: string;
  /** Sticker ID from the sticker registry */
  stickerId: string;
  /** Display name */
  name: string;
  /** Centre‑x in pixels relative to canvas */
  x: number;
  /** Centre‑y in pixels relative to canvas */
  y: number;
  /** Natural render width of the sticker at 1× */
  w: number;
  /** Natural render height (derived, or explicit) */
  h?: number;
  /** Scale factor (1 = default render size) */
  scale: number;
  /** Rotation in degrees */
  rotation: number;
  /** Layer opacity 0–1 */
  opacity: number;
  /** Whether the layer is locked (prevents drag/resize/rotate) */
  locked: boolean;
  /** Layer ordering (higher = on top) — alias: zIndex */
  z: number;
  /** Drop shadow effect */
  shadow: boolean;
  /** Blur effect */
  blur: boolean;
  /** Accent border */
  border: boolean;
  /** Corner radius */
  borderRadius: number;
  /** Custom text for text/caption layers */
  text?: string;

  // ── v2: Lens & Metric Binding ──
  /** Bound Strava metric ID (e.g., "distance", "pace") */
  boundMetricId?: string;
  /** Display mode for the metric */
  metricDisplay?: "full" | "value-only" | "label-only" | "label-value";
  /** Show unit */
  showUnit?: boolean;
  /** Custom prefix/suffix */
  prefix?: string;
  suffix?: string;

  // ── v2: Font & Color overrides ──
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textAlign?: "left" | "center" | "right";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  /** Override color */
  layerColor?: string;
  /** Background fill */
  layerBackground?: string;

  // ── Deprecated — kept for backward compat with existing editor ──
  /** @deprecated Use stickerId */
  templateId?: string;
  /** @deprecated Use stickerId */
  paletteId?: string;
  /** @deprecated Use v2 font properties */
  // fontFamily removed — use the v2 field above
  /** @deprecated Canvas-level palette now */
  backgroundStyle?: string;
  /** @deprecated Use z */
  zIndex?: number;
}

/** Snapshot of canvas state for undo/redo history */
interface CanvasSnapshot {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  lensId: string;
  backgroundId: string;
  filterId: string;
}

export interface CanvasState {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  /** Selected aspect ratio */
  ratio: CanvasRatio;
  /** Currently active Lens ID */
  lensId: string;
  /** Selected background preset ID */
  backgroundId: string;
  /** Selected photo filter ID */
  filterId: string;
  /** @deprecated Use backgroundId */
  photoUri: string | null;
  canUndo: boolean;
  canRedo: boolean;
  setRatio: (ratio: CanvasRatio) => void;
  setLens: (lensId: string) => void;
  setBackground: (id: string) => void;
  setFilter: (id: string) => void;
  /** @deprecated Use setBackground */
  setPhoto: (uri: string | null) => void;
  addLayer: (stickerId: string, name?: string, w?: number) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<CanvasLayer>) => void;
  /** Commit current layer positions to undo history (call on gesture END) */
  commitHistory: () => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  selectLayer: (id: string | null) => void;
  /** Update metric binding on a specific layer */
  bindMetric: (layerId: string, metricId: string) => void;
  resetCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

// ── Helpers ──

let _nextId = 0;
function genId(): string {
  return `layer-${++_nextId}-${Date.now()}`;
}

// ── Context ──

const CanvasContext = createContext<CanvasState | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [ratio, setRatio] = useState<CanvasRatio>("9:16");
  const [lensId, setLensId] = useState("sticker-dist-1");
  const [backgroundId, setBackgroundId] = useState("bg1");
  const [filterId, setFilterId] = useState("none");

  // ── Undo / Redo history ──
  const pastRef = useRef<CanvasSnapshot[]>([]);
  const futureRef = useRef<CanvasSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Deep-clone layers safely */
  const cloneLayers = useCallback((l: CanvasLayer[]) => {
    try { return JSON.parse(JSON.stringify(l)); }
    catch { return l.map(ol => ({ ...ol })); }
  }, []);

  /** Snapshot current canvas state before mutation */
  const pushHistory = useCallback((currentLayers?: CanvasLayer[]) => {
    const snapshot = currentLayers ?? layers;
    pastRef.current.push({
      layers: cloneLayers(snapshot),
      selectedLayerId,
      lensId,
      backgroundId,
      filterId,
    });
    if (pastRef.current.length > 50) pastRef.current.shift();
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [layers, selectedLayerId, lensId, backgroundId, filterId, cloneLayers]);

  /** Commit current state to history — call on gesture END */
  const commitHistory = useCallback(() => {
    pushHistory(layers);
  }, [layers, pushHistory]);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push({
      layers: cloneLayers(layers),
      selectedLayerId,
      lensId,
      backgroundId,
      filterId,
    });
    setLayers(prev.layers);
    // Preserve selection if the selected layer still exists
    const keep = prev.layers.some((l) => l.id === selectedLayerId)
      ? selectedLayerId
      : prev.layers.length > 0
        ? prev.layers[prev.layers.length - 1].id
        : null;
    setSelectedLayerId(keep);
    setLensId(prev.lensId);
    setBackgroundId(prev.backgroundId);
    setFilterId(prev.filterId);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
  }, [layers, selectedLayerId, lensId, backgroundId, filterId, cloneLayers]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push({
      layers: cloneLayers(layers),
      selectedLayerId,
      lensId,
      backgroundId,
      filterId,
    });
    setLayers(next.layers);
    setSelectedLayerId(next.selectedLayerId);
    setLensId(next.lensId);
    setBackgroundId(next.backgroundId);
    setFilterId(next.filterId);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
  }, [layers, selectedLayerId, lensId, backgroundId, filterId, cloneLayers]);

  const addLayer = useCallback((stickerId: string, name?: string, w?: number) => {
    pushHistory();
    const id = genId();
    const displayName = name ?? stickerId;
    const width = w ?? 250;
    setLayers((prev) => {
      const maxZ = prev.length > 0 ? Math.max(...prev.map((l) => l.z)) : 0;
      const z = maxZ + 1;
      const newLayer: CanvasLayer = {
        id,
        stickerId,
        name: displayName,
        x: 198,
        y: 250,
        w: width,
        scale: 1,
        rotation: 0,
        opacity: 1,
        locked: false,
        z,
        shadow: false,
        blur: false,
        border: false,
        borderRadius: 0,
        // Metric binding
        boundMetricId: undefined,
        metricDisplay: "full",
        showUnit: true,
        // Font defaults
        fontFamily: undefined,
        fontWeight: "700",
        fontStyle: "normal",
        fontSize: undefined,
        letterSpacing: undefined,
        lineHeight: undefined,
        textAlign: "center",
        textTransform: "none",
        // backward compat aliases
        templateId: stickerId,
        paletteId: "bright-white",
        backgroundStyle: "none",
        zIndex: z,
      };
      return [...prev, newLayer];
    });
    setSelectedLayerId(id);
  }, [pushHistory]);

  const removeLayer = useCallback((id: string) => {
    pushHistory();
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedLayerId((prev) => (prev === id ? null : prev));
  }, [pushHistory]);

  const updateLayer = useCallback((id: string, patch: Partial<CanvasLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  /** Bind a metric to a layer (live update, no history commit) */
  const bindMetric = useCallback((layerId: string, metricId: string) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === layerId
          ? { ...l, boundMetricId: metricId }
          : l,
      ),
    );
  }, []);

  const bringForward = useCallback((id: string) => {
    pushHistory();
    setLayers((prev) => {
      const maxZ = Math.max(...prev.map((l) => l.z));
      return prev.map((l) => (l.id === id ? { ...l, z: maxZ + 1 } : l));
    });
  }, [pushHistory]);

  const sendBackward = useCallback((id: string) => {
    pushHistory();
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.z - b.z);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const behind = sorted[idx - 1];
      return prev.map((l) => {
        if (l.id === id) return { ...l, z: behind.z };
        if (l.id === behind.id) return { ...l, z: sorted[idx].z };
        return l;
      });
    });
  }, [pushHistory]);

  const selectLayer = useCallback((id: string | null) => {
    setSelectedLayerId(id);
  }, []);

  const handleSetBackground = useCallback((id: string) => {
    pushHistory();
    setBackgroundId(id);
  }, [pushHistory]);

  const handleSetFilter = useCallback((id: string) => {
    pushHistory();
    setFilterId(id);
  }, [pushHistory]);

  const handleSetLens = useCallback((id: string) => {
    pushHistory();
    setLensId(id);
    // Clear layers so the new lens renders fresh
    setLayers([]);
    setSelectedLayerId(null);
  }, [pushHistory]);

  const resetCanvas = useCallback(() => {
    pushHistory();
    setLayers([]);
    setSelectedLayerId(null);
    setLensId("sticker-dist-1");
    setBackgroundId("bg1");
    setFilterId("none");
    setRatio("9:16");
  }, [pushHistory]);

  const value: CanvasState = {
    layers,
    selectedLayerId,
    ratio,
    lensId,
    backgroundId,
    filterId,
    photoUri: backgroundId,
    canUndo,
    canRedo,
    setRatio,
    setLens: handleSetLens,
    setBackground: handleSetBackground,
    setFilter: handleSetFilter,
    setPhoto: (uri: string | null) => { if (uri) handleSetBackground(uri); },
    addLayer,
    removeLayer,
    updateLayer,
    commitHistory,
    bringForward,
    sendBackward,
    selectLayer,
    bindMetric,
    resetCanvas,
    undo,
    redo,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas(): CanvasState {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used within CanvasProvider");
  return ctx;
}
