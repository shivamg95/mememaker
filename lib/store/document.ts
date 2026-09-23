import { create } from "zustand";
import { useStore } from "zustand";
import { temporal, type TemporalState } from "zundo";
import {
  cloneObject,
  createDefaultTexts,
  createImageObject,
  createPanelFromImage,
  createPanelFromTemplate,
  createStickerObject,
  createStrokeObject,
  createTextObject,
  emptyDocument,
  rememberUpload,
  reflow,
  targetPanel,
} from "../document";
import { displaySize } from "../geometry";
import { uid } from "../ids";
import type {
  CanvasObject,
  CropRect,
  Panel,
  PanelFilters,
  PersistedDocument,
  StudioTemplate,
  StripAxis,
  StrokeObject,
  UserUpload,
} from "../types";

type DocData = PersistedDocument;

type DocActions = {
  loadTemplate: (template: StudioTemplate) => void;
  loadImageAsTemplate: (image: {
    src: string;
    width: number;
    height: number;
    name: string;
  }) => void;
  replaceDocument: (doc: PersistedDocument) => void;
  resetDocument: () => void;
  addPanel: (
    side: "above" | "below" | "left" | "right",
    source?: { src: string | null; width: number; height: number; name: string; fill?: string },
  ) => string | undefined;
  removePanel: (id: string) => void;
  updatePanel: (id: string, patch: Partial<Panel>) => void;
  setPanelFilters: (id: string, patch: Partial<PanelFilters>) => void;
  applyCrop: (id: string, crop: CropRect | null) => void;
  addText: (panelId?: string | null) => string | undefined;
  addSticker: (
    sticker: { src: string; name: string; width?: number; height?: number },
    panelId?: string | null,
  ) => string | undefined;
  addImageObject: (
    image: { src: string; name: string; width: number; height: number },
    panelId?: string | null,
  ) => string | undefined;
  addStroke: (stroke: Omit<StrokeObject, "id" | "type" | "x" | "y" | "rotation" | "opacity" | "locked" | "visible">) => string;
  updateObject: (id: string, patch: Partial<CanvasObject>) => void;
  setObjects: (objects: CanvasObject[]) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => string[];
  moveObject: (id: string, direction: "forward" | "back" | "front" | "bottom") => void;
  reorderObject: (id: string, toIndex: number) => void;
  rememberUserUpload: (image: UserUpload) => void;
};

export type DocumentState = DocData & DocActions;

const initial = emptyDocument();

export const useDocStore = create<DocumentState>()(
  temporal(
    (set, get) => ({
      ...initial,
      loadTemplate: (template) => {
        const panel = createPanelFromTemplate(template);
        set({
          panels: [panel],
          objects: createDefaultTexts(panel, template.boxCount),
          templateName: template.name,
          templateId: template.id,
          stripAxis: "vertical",
        });
      },
      loadImageAsTemplate: (image) => {
        const panel = createPanelFromImage(image);
        const upload: UserUpload = { id: uid(), ...image };
        set({
          panels: [panel],
          objects: createDefaultTexts(panel, 2),
          templateName: image.name,
          templateId: null,
          stripAxis: "vertical",
          uploads: rememberUpload(get().uploads, upload),
        });
      },
      replaceDocument: (doc) => set({ ...doc }),
      resetDocument: () => set({ ...emptyDocument(), uploads: get().uploads }),
      addPanel: (side, source) => {
        const { panels, stripAxis } = get();
        const basis = panels[0];
        const axis: StripAxis =
          side === "left" || side === "right" ? "horizontal" : "vertical";
        const image = source ?? {
          src: basis?.src ?? null,
          width: basis?.naturalWidth ?? basis?.width ?? 1080,
          height: basis?.naturalHeight ?? basis?.height ?? 1080,
          name: basis?.name ?? "Panel",
          fill: basis?.fill,
        };
        const panel = createPanelFromImage({
          src: image.src ?? "",
          width: image.width,
          height: image.height,
          name: image.name,
        });
        if (!image.src) {
          panel.src = null;
          panel.fill = image.fill ?? "#141416";
        }
        const nextPanels =
          side === "above" || side === "left"
            ? [panel, ...panels]
            : [...panels, panel];
        const texts = createDefaultTexts(panel, 2);
        set({
          panels: reflow(nextPanels, axis),
          objects: [...get().objects, ...texts],
          stripAxis: axis,
          templateName:
            nextPanels.length > 1 ? `${get().templateName.replace(/ strip$/, "")} strip` : get().templateName,
        });
        return panel.id;
      },
      removePanel: (id) => {
        const { panels, objects, stripAxis } = get();
        if (panels.length <= 1) {
          set({ panels: [], objects: [], templateName: "Untitled", templateId: null });
          return;
        }
        set({
          panels: reflow(
            panels.filter((panel) => panel.id !== id),
            stripAxis,
          ),
          objects: objects.filter((object) => object.panelId !== id),
        });
      },
      updatePanel: (id, patch) => {
        const { panels, stripAxis } = get();
        set({
          panels: reflow(
            panels.map((panel) => (panel.id === id ? { ...panel, ...patch } : panel)),
            stripAxis,
          ),
        });
      },
      setPanelFilters: (id, patch) => {
        const { panels } = get();
        set({
          panels: panels.map((panel) =>
            panel.id === id
              ? { ...panel, filters: { ...panel.filters, ...patch } }
              : panel,
          ),
        });
      },
      applyCrop: (id, crop) => {
        const { panels, stripAxis } = get();
        set({
          panels: reflow(
            panels.map((panel) => {
              if (panel.id !== id) return panel;
              if (!crop) {
                return {
                  ...panel,
                  crop: null,
                  width: panel.naturalWidth,
                  height: panel.naturalHeight,
                };
              }
              return {
                ...panel,
                crop,
                width: crop.width,
                height: crop.height,
              };
            }),
            stripAxis,
          ),
        });
      },
      addText: (panelId) => {
        const panel = targetPanel(get().panels, panelId);
        if (!panel) return;
        const size = displaySize(panel);
        const object = createTextObject(panel, {
          y: size.height * 0.4,
          placeholder: "TEXT",
        });
        set({ objects: [...get().objects, object] });
        return object.id;
      },
      addSticker: (sticker, panelId) => {
        const panel = targetPanel(get().panels, panelId);
        if (!panel) return;
        const object = createStickerObject(panel, sticker);
        set({ objects: [...get().objects, object] });
        return object.id;
      },
      addImageObject: (image, panelId) => {
        const panel = targetPanel(get().panels, panelId);
        if (!panel) return;
        const object = createImageObject(panel, image);
        const upload: UserUpload = { id: uid(), ...image };
        set({
          objects: [...get().objects, object],
          uploads: rememberUpload(get().uploads, upload),
        });
        return object.id;
      },
      addStroke: (stroke) => {
        const object = createStrokeObject(stroke);
        set({ objects: [...get().objects, object] });
        return object.id;
      },
      updateObject: (id, patch) => {
        set({
          objects: get().objects.map((object) =>
            object.id === id ? ({ ...object, ...patch } as CanvasObject) : object,
          ),
        });
      },
      setObjects: (objects) => set({ objects }),
      deleteObjects: (ids) => {
        const idSet = new Set(ids);
        set({ objects: get().objects.filter((object) => !idSet.has(object.id)) });
      },
      duplicateObjects: (ids) => {
        const idSet = new Set(ids);
        const clones = get()
          .objects.filter((object) => idSet.has(object.id))
          .map(cloneObject);
        set({ objects: [...get().objects, ...clones] });
        return clones.map((clone) => clone.id);
      },
      moveObject: (id, direction) => {
        const objects = [...get().objects];
        const index = objects.findIndex((object) => object.id === id);
        if (index < 0) return;
        const [item] = objects.splice(index, 1);
        if (direction === "bottom") objects.unshift(item);
        else if (direction === "front") objects.push(item);
        else if (direction === "back") objects.splice(Math.max(0, index - 1), 0, item);
        else objects.splice(Math.min(objects.length, index + 1), 0, item);
        set({ objects });
      },
      reorderObject: (id, toIndex) => {
        const objects = [...get().objects];
        const from = objects.findIndex((object) => object.id === id);
        if (from < 0) return;
        const [item] = objects.splice(from, 1);
        objects.splice(Math.max(0, Math.min(toIndex, objects.length)), 0, item);
        set({ objects });
      },
      rememberUserUpload: (image) => {
        set({ uploads: rememberUpload(get().uploads, image) });
      },
    }),
    {
      limit: 50,
      partialize: (state) => ({
        panels: state.panels,
        objects: state.objects,
        templateName: state.templateName,
        templateId: state.templateId,
        stripAxis: state.stripAxis,
      }),
    },
  ),
);

export function useTemporalStore<T>(
  selector: (state: TemporalState<Partial<DocData>>) => T,
) {
  return useStore(useDocStore.temporal, selector);
}

export function withoutHistory(fn: () => void) {
  const temporalStore = useDocStore.temporal.getState();
  temporalStore.pause();
  fn();
  temporalStore.resume();
}

export function pauseHistory() {
  useDocStore.temporal.getState().pause();
}

export function resumeHistory() {
  useDocStore.temporal.getState().resume();
}

export function clearHistory() {
  useDocStore.temporal.getState().clear();
}
