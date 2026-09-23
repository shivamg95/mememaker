"use client";

import CanvasStage from "@/components/studio/CanvasStage";
import { Inspector } from "@/components/studio/Inspector";
import { LayerList } from "@/components/studio/LayerList";
import { LeftRail } from "@/components/studio/LeftRail";
import { MobileDock, MobileSheetHost } from "@/components/studio/MobileDock";
import { ExportSheet } from "@/components/studio/ExportSheet";
import { TopBar } from "@/components/studio/TopBar";
import { useStudioKeyboard } from "@/components/studio/useStudioKeyboard";
import { loadDraft, saveDraft } from "@/lib/persist";
import { clearHistory, useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import { useEffect, useRef } from "react";

export default function StudioShell() {
  useStudioKeyboard();
  const hydrated = useStudioStore((state) => state.hydrated);
  const setHydrated = useStudioStore((state) => state.setHydrated);
  const toast = useStudioStore((state) => state.toast);
  const clearToast = useStudioStore((state) => state.clearToast);
  const requestFit = useStudioStore((state) => state.requestFit);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDraft().then((draft) => {
      if (cancelled) return;
      if (draft?.panels?.length) {
        useDocStore.setState({
          panels: draft.panels,
          objects: draft.objects,
          templateName: draft.templateName,
          templateId: draft.templateId,
          stripAxis: draft.stripAxis,
          uploads: draft.uploads ?? [],
        });
        clearHistory();
        requestFit();
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [requestFit, setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    return useDocStore.subscribe(() => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        const latest = useDocStore.getState();
        if (latest.panels.length === 0) return;
        saveDraft({
          panels: latest.panels,
          objects: latest.objects,
          templateName: latest.templateName,
          templateId: latest.templateId,
          stripAxis: latest.stripAxis,
          uploads: latest.uploads,
        });
      }, 400);
    });
  }, [hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 2800);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  return (
    <div className="flex h-dvh flex-col bg-bg text-bone">
      <TopBar />
      <div className="relative flex min-h-0 flex-1">
        <div className="hidden lg:flex">
          <LeftRail />
        </div>
        <main className="relative min-h-0 min-w-0 flex-1">
          <div className="absolute inset-0">
            <CanvasStage />
          </div>
        </main>
        <div className="hidden lg:flex">
          <Inspector />
        </div>
      </div>
      <MobileSheetHost
        templates={<LeftRail hideLayers />}
        inspector={<Inspector />}
        layers={<LayerList />}
      />
      <MobileDock />
      <ExportSheet />
      {toast && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-[10px] bg-raised px-3 py-2 text-[12px] ring-1 ring-hairline lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}
