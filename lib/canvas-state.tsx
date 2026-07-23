/**
 * Canvas layer state management for the photo+template editor.
 *
 * Each layer is a draggable / resizable / rotatable template overlay
 * positioned on the photo canvas. State is ephemeral (session-only).
 */

import React, { createContext, useContext, useCallback, useState } from "react";
import { DEFAULT_PRESET_ID } from "./color-presets";

// ── Types ──

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
  /** Layer ordering (higher = on top) */
  zIndex: number;
}

interface CanvasState {
  layers: CanvasLayer[];
  selectedLayerId: string | null;
  photoUri: string | null;
  addLayer: (templateId: string) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<CanvasLayer>) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  selectLayer: (id: string | null) => void;
  setPhoto: (uri: string | null) => void;
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

  const addLayer = useCallback((templateId: string) => {
    const id = genId();
    // Start centred, at z-index just above the topmost layer
    const maxZ = layers.length > 0 ? Math.max(...layers.map((l) => l.zIndex)) : 0;
    const newLayer: CanvasLayer = {
      id,
      templateId,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      paletteId: DEFAULT_PRESET_ID,
      zIndex: maxZ + 1,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers]);

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedLayerId((prev) => (prev === id ? null : prev));
  }, []);

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
    setPhotoUri(uri);
  }, []);

  const value: CanvasState = {
    layers,
    selectedLayerId,
    photoUri,
    addLayer,
    removeLayer,
    updateLayer,
    bringForward,
    sendBackward,
    selectLayer,
    setPhoto,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas(): CanvasState {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used within CanvasProvider");
  return ctx;
}
