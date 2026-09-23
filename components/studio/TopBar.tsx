"use client";

import { IconButton, PrimaryButton } from "@/components/studio/controls";
import { clamp } from "@/lib/geometry";
import { clearDraft } from "@/lib/persist";
import { useDocStore, useTemporalStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import { Minus, Plus, Redo2, Undo2 } from "lucide-react";

export function TopBar() {
  const templateName = useDocStore((state) => state.templateName);
  const hasPanels = useDocStore((state) => state.panels.length > 0);
  const resetDocument = useDocStore((state) => state.resetDocument);
  const zoom = useStudioStore((state) => state.zoom);
  const setZoom = useStudioStore((state) => state.setZoom);
  const requestFit = useStudioStore((state) => state.requestFit);
  const setExportOpen = useStudioStore((state) => state.setExportOpen);
  const select = useStudioStore((state) => state.select);
  const canUndo = useTemporalStore((state) => state.pastStates.length > 0);
  const canRedo = useTemporalStore((state) => state.futureStates.length > 0);

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-hairline bg-surface px-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="font-serif text-[18px] italic tracking-tight text-bone">
          Atelier
        </span>
        <span className="hidden h-3 w-px bg-hairline sm:block" />
        <span className="hidden min-w-0 truncate text-[13px] text-muted sm:block">
          {templateName}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <IconButton
          label="Undo"
          disabled={!canUndo}
          onClick={() => useDocStore.temporal.getState().undo()}
        >
          <Undo2 size={15} />
        </IconButton>
        <IconButton
          label="Redo"
          disabled={!canRedo}
          onClick={() => useDocStore.temporal.getState().redo()}
        >
          <Redo2 size={15} />
        </IconButton>
        <div className="mx-1 hidden items-center gap-1 md:flex">
          <IconButton
            label="Zoom out"
            onClick={() => setZoom(clamp(zoom / 1.12, 0.08, 4))}
          >
            <Minus size={14} />
          </IconButton>
          <button
            type="button"
            onClick={requestFit}
            className="min-w-12 rounded-[10px] px-1 text-[11px] text-muted hover:text-bone"
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconButton
            label="Zoom in"
            onClick={() => setZoom(clamp(zoom * 1.12, 0.08, 4))}
          >
            <Plus size={14} />
          </IconButton>
        </div>
        <button
          type="button"
          onClick={() => {
            select([]);
            resetDocument();
            void clearDraft();
            requestFit();
          }}
          className="h-8 rounded-[10px] px-2 text-[12px] text-muted hover:text-bone"
        >
          New
        </button>
        <PrimaryButton
          disabled={!hasPanels}
          onClick={() => setExportOpen(true)}
        >
          Export
        </PrimaryButton>
      </div>
    </header>
  );
}
