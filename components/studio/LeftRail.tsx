"use client";

import { LayerList } from "@/components/studio/LayerList";
import { FieldLabel, Segmented } from "@/components/studio/controls";
import { cn } from "@/lib/cn";
import { resolveSrc } from "@/lib/image-src";
import { STICKERS } from "@/lib/stickers";
import { clearHistory, useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import { CATEGORIES } from "@/lib/templates/catalog";
import { BLANKS } from "@/lib/templates/blanks";
import { readImageFile } from "@/lib/image-src";
import type { LeftTab, StudioTemplate } from "@/lib/types";
import { Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export function LeftRail({ hideLayers = false }: { hideLayers?: boolean }) {
  const leftTab = useStudioStore((state) => state.leftTab);
  const setLeftTab = useStudioStore((state) => state.setLeftTab);

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-hairline bg-surface lg:w-[280px]">
      <div className="p-3 pb-2">
        <Segmented<LeftTab>
          value={leftTab}
          onChange={setLeftTab}
          options={[
            { id: "templates", label: "Templates" },
            { id: "stickers", label: "Stickers" },
            { id: "uploads", label: "Uploads" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {leftTab === "templates" && <TemplateGallery />}
        {leftTab === "stickers" && <StickerGallery />}
        {leftTab === "uploads" && <UploadsPanel />}
      </div>
      {!hideLayers && (
        <div className="border-t border-hairline p-3">
          <FieldLabel>Layers</FieldLabel>
          <div className="max-h-40 overflow-y-auto">
            <LayerList />
          </div>
        </div>
      )}
    </aside>
  );
}

function TemplateGallery() {
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Trending");
  const [loading, setLoading] = useState(true);
  const loadTemplate = useDocStore((state) => state.loadTemplate);
  const requestFit = useStudioStore((state) => state.requestFit);
  const select = useStudioStore((state) => state.select);
  const setActivePanel = useStudioStore((state) => state.setActivePanel);
  const showToast = useStudioStore((state) => state.showToast);
  const setMobileSheet = useStudioStore((state) => state.setMobileSheet);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data: { templates?: StudioTemplate[] }) => {
        if (!cancelled) setTemplates(data.templates ?? []);
      })
      .catch(() => {
        if (!cancelled) showToast("Templates unavailable. Blanks still work.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool =
      category === "Blank"
        ? BLANKS
        : category === "Trending"
          ? templates
          : category === "All"
            ? [...BLANKS, ...templates]
            : [...BLANKS, ...templates].filter((item) => item.category === category);
    if (!q) return pool;
    return pool.filter((item) => {
      const hay = `${item.name} ${item.aliases.join(" ")} ${item.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, query, category]);

  function apply(template: StudioTemplate) {
    loadTemplate(template);
    const panels = useDocStore.getState().panels;
    select([]);
    setActivePanel(panels[0]?.id ?? null);
    clearHistory();
    requestFit();
    setMobileSheet(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search templates"
        className="h-9 rounded-[10px] bg-bg px-3 text-[13px] outline-none ring-1 ring-hairline placeholder:text-muted focus:ring-amber/40"
      />
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full px-2 py-1 text-[11px] ring-1 ring-hairline transition-colors duration-150",
              category === item ? "bg-raised text-bone" : "text-muted hover:text-bone",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-16 items-center justify-center gap-2 rounded-[10px] border border-dashed border-hairline text-[12px] text-muted transition-colors duration-150 hover:text-bone"
      >
        <Upload size={14} />
        Upload image
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            const image = await readImageFile(file);
            useDocStore.getState().loadImageAsTemplate(image);
            select([]);
            setActivePanel(useDocStore.getState().panels[0]?.id ?? null);
            clearHistory();
            requestFit();
            setMobileSheet(null);
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not upload");
          }
        }}
      />
      {loading && category !== "Blank" ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-square animate-pulse rounded-[10px] bg-raised" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => apply(template)}
              className="group relative overflow-hidden rounded-[10px] bg-raised ring-1 ring-hairline"
            >
              {template.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveSrc(template.url)}
                  alt={template.name}
                  className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
                />
              ) : (
                <div
                  className="aspect-square w-full"
                  style={{
                    background: template.fill2
                      ? `linear-gradient(180deg, ${template.fill}, ${template.fill2})`
                      : template.fill,
                  }}
                />
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-[11px] text-bone opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
                {template.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StickerGallery() {
  const panels = useDocStore((state) => state.panels);
  const addSticker = useDocStore((state) => state.addSticker);
  const activePanelId = useStudioStore((state) => state.activePanelId);
  const select = useStudioStore((state) => state.select);
  const setTool = useStudioStore((state) => state.setTool);
  const showToast = useStudioStore((state) => state.showToast);
  const setMobileSheet = useStudioStore((state) => state.setMobileSheet);

  return (
    <div className="grid grid-cols-3 gap-2">
      {STICKERS.map((sticker) => (
        <button
          key={sticker.id}
          type="button"
          onClick={() => {
            if (!panels.length) {
              showToast("Choose a template first");
              return;
            }
            const id = addSticker(sticker, activePanelId);
            if (id) {
              setTool("select");
              select([id]);
              setMobileSheet(null);
            }
          }}
          className="flex aspect-square items-center justify-center rounded-[10px] bg-[#232328] p-2 ring-1 ring-hairline transition-colors duration-150 hover:bg-[#2a2a30]"
          title={sticker.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sticker.src} alt={sticker.name} className="max-h-full max-w-full" />
        </button>
      ))}
    </div>
  );
}

function UploadsPanel() {
  const uploads = useDocStore((state) => state.uploads);
  const loadImageAsTemplate = useDocStore((state) => state.loadImageAsTemplate);
  const addImageObject = useDocStore((state) => state.addImageObject);
  const addPanel = useDocStore((state) => state.addPanel);
  const panels = useDocStore((state) => state.panels);
  const activePanelId = useStudioStore((state) => state.activePanelId);
  const requestFit = useStudioStore((state) => state.requestFit);
  const select = useStudioStore((state) => state.select);
  const setActivePanel = useStudioStore((state) => state.setActivePanel);
  const showToast = useStudioStore((state) => state.showToast);
  const urlRef = useRef<HTMLInputElement>(null);

  const applyAsTemplate = (image: {
    src: string;
    width: number;
    height: number;
    name: string;
  }) => {
    loadImageAsTemplate(image);
    select([]);
    setActivePanel(useDocStore.getState().panels[0]?.id ?? null);
    clearHistory();
    requestFit();
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const url = urlRef.current?.value.trim();
          if (!url) return;
          try {
            const src = resolveSrc(url);
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error("Could not load URL"));
              img.src = src;
            });
            applyAsTemplate({
              src: url,
              width: img.naturalWidth,
              height: img.naturalHeight,
              name: "Upload",
            });
            if (urlRef.current) urlRef.current.value = "";
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not load URL");
          }
        }}
        className="flex gap-2"
      >
        <input
          ref={urlRef}
          placeholder="Paste image or URL"
          onPaste={async (event) => {
            const file = Array.from(event.clipboardData?.items ?? [])
              .find((item) => item.kind === "file" && item.type.startsWith("image/"))
              ?.getAsFile();
            if (!file) return;
            event.preventDefault();
            try {
              const image = await readImageFile(file);
              applyAsTemplate({ ...image, name: image.name || "Pasted image" });
              if (urlRef.current) urlRef.current.value = "";
            } catch (error) {
              showToast(error instanceof Error ? error.message : "Could not paste image");
            }
          }}
          className="h-9 min-w-0 flex-1 rounded-[10px] bg-bg px-3 text-[13px] outline-none ring-1 ring-hairline placeholder:text-muted focus:ring-amber/40"
        />
        <button
          type="submit"
          className="h-9 rounded-[10px] px-2 text-[12px] ring-1 ring-hairline hover:bg-raised"
        >
          Load
        </button>
      </form>
      {uploads.length === 0 ? (
        <p className="text-[12px] text-muted">Uploaded images will appear here.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {uploads.map((upload) => (
            <div key={upload.id} className="overflow-hidden rounded-[10px] ring-1 ring-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={upload.src} alt={upload.name} className="aspect-square w-full object-cover" />
              <div className="flex">
                <button
                  type="button"
                  className="flex-1 py-1 text-[11px] text-muted hover:text-bone"
                  onClick={() => {
                    loadImageAsTemplate(upload);
                    select([]);
                    setActivePanel(useDocStore.getState().panels[0]?.id ?? null);
                    clearHistory();
                    requestFit();
                  }}
                >
                  Canvas
                </button>
                <button
                  type="button"
                  className="flex-1 py-1 text-[11px] text-muted hover:text-bone"
                  onClick={() => {
                    if (!panels.length) {
                      showToast("Choose a template first");
                      return;
                    }
                    const id = addImageObject(upload, activePanelId);
                    if (id) select([id]);
                  }}
                >
                  Sticker
                </button>
                <button
                  type="button"
                  className="flex-1 py-1 text-[11px] text-muted hover:text-bone"
                  onClick={() => {
                    const id = addPanel("below", upload);
                    if (id) setActivePanel(id);
                    requestFit();
                  }}
                >
                  Panel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
