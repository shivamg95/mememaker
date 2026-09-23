"use client";

import { cn } from "@/lib/cn";
import { objectLabel } from "@/lib/document";
import { useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import { Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown } from "lucide-react";

export function LayerList() {
  const objects = useDocStore((state) => state.objects);
  const updateObject = useDocStore((state) => state.updateObject);
  const moveObject = useDocStore((state) => state.moveObject);
  const selection = useStudioStore((state) => state.selection);
  const select = useStudioStore((state) => state.select);
  const setTool = useStudioStore((state) => state.setTool);
  const reversed = [...objects].reverse();

  if (objects.length === 0) {
    return (
      <p className="px-1 py-3 text-[12px] text-muted">No layers yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {reversed.map((object) => {
        const selected = selection.includes(object.id);
        return (
          <button
            key={object.id}
            type="button"
            onClick={() => {
              setTool("select");
              select([object.id]);
            }}
            className={cn(
              "flex h-8 items-center gap-2 rounded-[10px] px-2 text-left text-[12px] transition-colors duration-150",
              selected ? "bg-raised text-bone" : "text-muted hover:text-bone",
            )}
          >
            <span className="min-w-0 flex-1 truncate">{objectLabel(object)}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                moveObject(object.id, "forward");
              }}
              className="text-muted hover:text-bone"
            >
              <ChevronUp size={13} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                moveObject(object.id, "back");
              }}
              className="text-muted hover:text-bone"
            >
              <ChevronDown size={13} />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                updateObject(object.id, { visible: !object.visible });
              }}
              className="text-muted hover:text-bone"
            >
              {object.visible ? <Eye size={13} /> : <EyeOff size={13} />}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                updateObject(object.id, { locked: !object.locked });
              }}
              className="text-muted hover:text-bone"
            >
              {object.locked ? <Lock size={13} /> : <Unlock size={13} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
