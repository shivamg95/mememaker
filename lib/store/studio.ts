import { create } from "zustand";
import { initialCropRect } from "../geometry";
import type {
  CropRect,
  DraftStroke,
  ExportSettings,
  LeftTab,
  MobileSheet,
  Tool,
} from "../types";
import { useDocStore } from "./document";

type StudioState = {
  selection: string[];
  activePanelId: string | null;
  tool: Tool;
  zoom: number;
  stagePos: { x: number; y: number };
  leftTab: LeftTab;
  mobileSheet: MobileSheet;
  exportOpen: boolean;
  cropPanelId: string | null;
  cropDraft: CropRect | null;
  cropLockAspect: boolean;
  editingTextId: string | null;
  spacePressed: boolean;
  panning: boolean;
  fitNonce: number;
  hydrated: boolean;
  toast: string | null;
  drawColor: string;
  drawWidth: number;
  draftStroke: DraftStroke | null;
  exporting: boolean;
  exportSettings: ExportSettings;
  select: (ids: string[]) => void;
  setActivePanel: (id: string | null) => void;
  setTool: (tool: Tool) => void;
  setZoom: (zoom: number) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setLeftTab: (tab: LeftTab) => void;
  setMobileSheet: (sheet: MobileSheet) => void;
  openMobileSheet: (sheet: Exclude<MobileSheet, null>) => void;
  setExportOpen: (open: boolean) => void;
  setCropPanelId: (id: string | null) => void;
  setCropDraft: (draft: CropRect | null) => void;
  setCropLockAspect: (lock: boolean) => void;
  setEditingTextId: (id: string | null) => void;
  setSpacePressed: (pressed: boolean) => void;
  setPanning: (panning: boolean) => void;
  requestFit: () => void;
  setHydrated: (hydrated: boolean) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  setDrawColor: (color: string) => void;
  setDrawWidth: (width: number) => void;
  setDraftStroke: (stroke: DraftStroke | null) => void;
  setExporting: (exporting: boolean) => void;
  patchExport: (patch: Partial<ExportSettings>) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  selection: [],
  activePanelId: null,
  tool: "select",
  zoom: 1,
  stagePos: { x: 0, y: 0 },
  leftTab: "templates",
  mobileSheet: null,
  exportOpen: false,
  cropPanelId: null,
  cropDraft: null,
  cropLockAspect: true,
  editingTextId: null,
  spacePressed: false,
  panning: false,
  fitNonce: 0,
  hydrated: false,
  toast: null,
  drawColor: "#E8B86D",
  drawWidth: 6,
  draftStroke: null,
  exporting: false,
  exportSettings: {
    format: "png",
    scale: 1,
    quality: 0.92,
    watermark: true,
  },
  select: (ids) => set({ selection: ids }),
  setActivePanel: (id) => set({ activePanelId: id }),
  setTool: (tool) => set(tool === "select" ? { tool } : { tool, selection: [] }),
  setZoom: (zoom) => set({ zoom }),
  setStagePos: (stagePos) => set({ stagePos }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setMobileSheet: (mobileSheet) => set({ mobileSheet }),
  openMobileSheet: (sheet) =>
    set((state) => {
      const next = state.mobileSheet === sheet ? null : sheet;
      return {
        mobileSheet: next,
        tool: next === "draw" ? "pen" : next ? "select" : state.tool,
        leftTab:
          sheet === "stickers"
            ? "stickers"
            : sheet === "templates"
              ? "templates"
              : state.leftTab,
        selection: next === "draw" ? [] : state.selection,
      };
    }),
  setExportOpen: (exportOpen) => set({ exportOpen }),
  setCropPanelId: (cropPanelId) => {
    if (!cropPanelId) {
      set({ cropPanelId: null, cropDraft: null });
      return;
    }
    const panel = useDocStore.getState().panels.find((item) => item.id === cropPanelId);
    set({
      cropPanelId,
      cropDraft: panel ? initialCropRect(panel) : null,
      selection: [],
      tool: "select",
    });
  },
  setCropDraft: (cropDraft) => set({ cropDraft }),
  setCropLockAspect: (cropLockAspect) => set({ cropLockAspect }),
  setEditingTextId: (editingTextId) => set({ editingTextId }),
  setSpacePressed: (spacePressed) => set({ spacePressed }),
  setPanning: (panning) => set({ panning }),
  requestFit: () => set((state) => ({ fitNonce: state.fitNonce + 1 })),
  setHydrated: (hydrated) => set({ hydrated }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setDrawColor: (drawColor) => set({ drawColor }),
  setDrawWidth: (drawWidth) => set({ drawWidth }),
  setDraftStroke: (draftStroke) => set({ draftStroke }),
  setExporting: (exporting) => set({ exporting }),
  patchExport: (patch) =>
    set((state) => ({ exportSettings: { ...state.exportSettings, ...patch } })),
}));
