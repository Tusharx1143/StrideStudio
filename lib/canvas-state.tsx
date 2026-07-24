/**
 * Canvas layer state management for the photo+template editor.
 *
 * Each layer is a draggable / resizable / rotatable template overlay
 * positioned on the photo canvas. State is ephemeral (session-only).
 */

import React, { createContext, useContext, useCallback, useState, useRef } from "react";
import { DEFAULT_PRESET_ID, DEFAULT_FONT_FAMILY, type FontFamily } from "./color-presets";

// ── Types ──

/** Background style for the layer card behind the template */
export type LayerBackground = 'none' | 'glass' | 'solid' | 'outlined';

export interface CanvasLayer {
  id: string;
  templateId: string;
  /** Centre‑x, 0–1 fraction of canvas width */
  x: number;
  /** Centre‑y, 0–1 fraction of canvas height */
  y: number;
  /** Scale factor (1 = default render size) */
  scale: number;
  /** Rotation in radians */
  rotation: number;
  /** Which color preset this layer uses */
  paletteId: string;
  /** Font family override */
  fontFamily: FontFamily;
  /** Layer ordering (higher = on top) */
  zIndex: number;
  /** Background card style behind the template */
  backgroundStyle: LayerBackground;
}

/** Snapshot of canvas state for undo/redo history */
interface CanvasSnapshot {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  photoUri: string | null;
}

interface CanvasState {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  photoUri: string | null;
  canUndo: boolean;
  canRedo: boolean;
  addLayer: (templateId: string) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<CanvasLayer>) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  selectLayer: (id: string | null) => void;
  setPhoto: (uri: string | null) => void;
  resetCanvas: () => void;
  undo: () => void;
  redo: () => void;
}

// ── Helpers ──

let _nextId = 0;
function genId(): string {
  return `layer-${++_nextId}-${Date.now()}`;
}

function sortByZIndex(layers: CanvasLayer[]): CanvasLayer[] {
  return [...layers].sort((a, b) => a.zIndex - b.zIndex);
}

// ── Context ──

const CanvasContext = createContext<CanvasState | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // ── Undo / Redo history ──
  const pastRef = useRef<CanvasSnapshot[]>([]);
  const futureRef = useRef<CanvasSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Snapshot current canvas state before mutation */
  const pushHistory = useCallback(() => {
    pastRef.current.push({
      layers: JSON.parse(JSON.stringify(layers)),
      selectedLayerId,
      photoUri,
    });
    // Cap history at 50 entries
    if (pastRef.current.length > 50) pastRef.current.shift();
    futureRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [layers, selectedLayerId, photoUri]);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    // Save current state to future stack
    futureRef.current.push({ layers: JSON.parse(JSON.stringify(layers)), selectedLayerId, photoUri });
    setLayers(prev.layers);
    setSelectedLayerId(prev.selectedLayerId);
    setPhotoUri(prev.photoUri);
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, selectedLayerId, photoUri]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    // Save current state to past stack
    pastRef.current.push({ layers: JSON.parse(JSON.stringify(layers)), selectedLayerId, photoUri });
    setLayers(next.layers);
    setSelectedLayerId(next.selectedLayerId);
    setPhotoUri(next.photoUri);
    setCanUndo(true);
    setCanRedo(futureRef.current.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, selectedLayerId, photoUri]);

  const addLayer = useCallback((templateId: string) => {
    const id = genId();
    setLayers((prev) => {
      // Compute maxZ from prev (functional updater) to avoid stale-closure bugs
      const maxZ = prev.length > 0 ? Math.max(...prev.map((l) => l.zIndex)) : 0;
      const newLayer: CanvasLayer = {
        id,
        templateId,
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: 0,
        paletteId: DEFAULT_PRESET_ID,
        fontFamily: DEFAULT_FONT_FAMILY,
        zIndex: maxZ + 1,
        backgroundStyle: 'none',
      };
      return [...prev, newLayer];
    });
    setSelectedLayerId(id);
  }, []);

  const removeLayer = useCallback((id: string) => {
    pushHistory();
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedLayerId((prev) => (prev === id ? null : prev));
  }, [pushHistory]);

  const updateLayer = useCallback((id: string, patch: Partial<CanvasLayer>) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const bringForward = useCallback((id: string) => {
    setLayers((prev) => {
      const maxZ = Math.max(...prev.map((l) => l.zIndex));
      return prev.map((l) => (l.id === id ? { ...l, zIndex: maxZ + 1 } : l));
    });
  }, []);

  const sendBackward = useCallback((id: string) => {
    setLayers((prev) => {
      const sorted = sortByZIndex(prev);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx <= 0) return prev; // already at the back
      // Swap z-indexes with the layer behind
      const behind = sorted[idx - 1];
      return prev.map((l) => {
        if (l.id === id) return { ...l, zIndex: behind.zIndex };
        if (l.id === behind.id) return { ...l, zIndex: sorted[idx].zIndex };
        return l;
      });
    });
  }, []);

  const selectLayer = useCallback((id: string | null) => {
    setSelectedLayerId(id);
  }, []);

  const setPhoto = useCallback((uri: string | null) => {
    pushHistory();
    setPhotoUri(uri);
  }, [pushHistory]);

  const resetCanvas = useCallback(() => {
    pushHistory();
    setLayers([]);
    setSelectedLayerId(null);
    setPhotoUri(null);
  }, [pushHistory]);

  const value: CanvasState = {
    layers,
    selectedLayerId,
    photoUri,
    canUndo,
    canRedo,
    addLayer,
    removeLayer,
    updateLayer,
    bringForward,
    sendBackward,
    selectLayer,
    setPhoto,
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
