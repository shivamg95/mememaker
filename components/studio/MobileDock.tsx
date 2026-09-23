"use client";

import { cn } from "@/lib/cn";
import { useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import type { MobileSheet } from "@/lib/types";
import { LayoutGrid, Layers, Pencil, SlidersHorizontal, Sticker, Type } from "lucide-react";
import type { ReactNode } from "react";

const ITEMS: { id: Exclude<MobileSheet, null>; label: string; icon: typeof Type }[] = [
  { id: "templates", label: "Templates", icon: LayoutGrid },
  { id: "text", label: "Text", icon: Type },
  { id: "stickers", label: "Stickers", icon: Sticker },
  { id: "draw", label: "Draw", icon: Pencil },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "adjust", label: "Adjust", icon: SlidersHorizontal },
];

export function MobileDock() {
  const sheet = useStudioStore((state) => state.mobileSheet);
  const openMobileSheet = useStudioStore((state) => state.openMobileSheet);
  const setMobileSheet = useStudioStore((state) => state.setMobileSheet);
  const setTool = useStudioStore((state) => state.setTool);
  const select = useStudioStore((state) => state.select);
  const activePanelId = useStudioStore((state) => state.activePanelId);
  const addText = useDocStore((state) => state.addText);
  const showToast = useStudioStore((state) => state.showToast);
  const panels = useDocStore((state) => state.panels);

  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-hairline bg-surface px-1 pb-[env(safe-area-inset-bottom)] pt-1 lg:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = sheet === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === "text") {
                if (!panels.length) {
                  showToast("Choose a template first");
                  return;
                }
                const id = addText(activePanelId);
                if (id) {
                  setTool("select");
                  select([id]);
                }
                setMobileSheet("text");
                return;
              }
              openMobileSheet(item.id);
            }}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
              active ? "text-amber" : "text-muted",
            )}
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function MobileSheetHost({
  templates,
  inspector,
  layers,
}: {
  templates: ReactNode;
  inspector: ReactNode;
  layers: ReactNode;
}) {
  const sheet = useStudioStore((state) => state.mobileSheet);
  const setMobileSheet = useStudioStore((state) => state.setMobileSheet);
  if (!sheet) return null;

  const title =
    sheet === "templates"
      ? "Templates"
      : sheet === "stickers"
        ? "Stickers"
        : sheet === "layers"
          ? "Layers"
          : sheet === "adjust"
            ? "Adjust"
            : sheet === "text"
              ? "Text"
              : "Draw";

  return (
    <div className="z-40 flex max-h-[75vh] min-h-[40vh] flex-col rounded-t-[16px] bg-surface ring-1 ring-hairline lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[13px] font-medium">{title}</span>
        <button
          type="button"
          onClick={() => setMobileSheet(null)}
          className="text-[12px] text-muted"
        >
          Done
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {(sheet === "templates" || sheet === "stickers") && templates}
        {(sheet === "text" || sheet === "draw" || sheet === "adjust") && inspector}
        {sheet === "layers" && layers}
      </div>
    </div>
  );
}
