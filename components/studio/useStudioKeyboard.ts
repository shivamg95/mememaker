"use client";

import { useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import { useEffect } from "react";

export function useStudioKeyboard() {
  useEffect(() => {
    function typing(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      return (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      const studio = useStudioStore.getState();
      const doc = useDocStore.getState();
      const meta = event.metaKey || event.ctrlKey;

      if (event.code === "Space" && !typing(event)) {
        event.preventDefault();
        studio.setSpacePressed(true);
        return;
      }

      if (typing(event) && event.key !== "Escape") return;

      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) useDocStore.temporal.getState().redo();
        else useDocStore.temporal.getState().undo();
        return;
      }
      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        useDocStore.temporal.getState().redo();
        return;
      }
      if (meta && event.key.toLowerCase() === "d") {
        event.preventDefault();
        if (studio.selection.length) {
          studio.select(doc.duplicateObjects(studio.selection));
        }
        return;
      }
      if (meta && event.key.toLowerCase() === "e") {
        event.preventDefault();
        if (doc.panels.length) studio.setExportOpen(true);
        return;
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (studio.selection.length) {
          event.preventDefault();
          doc.deleteObjects(studio.selection);
          studio.select([]);
        }
        return;
      }
      if (event.key === "Escape") {
        studio.select([]);
        studio.setMobileSheet(null);
        studio.setExportOpen(false);
        studio.setCropPanelId(null);
        studio.setEditingTextId(null);
        studio.setTool("select");
        return;
      }
      if (event.key === "t" || event.key === "T") {
        const id = doc.addText(studio.activePanelId);
        if (id) {
          studio.setTool("select");
          studio.select([id]);
        }
        return;
      }
      if (event.key === "v" || event.key === "V") {
        studio.setTool("select");
        return;
      }
      if (event.key === "p" || event.key === "P") {
        studio.setTool("pen");
        return;
      }
      if (event.key === "0") {
        studio.requestFit();
        return;
      }
      if (event.key === "[") {
        studio.selection.forEach((id) => doc.moveObject(id, "back"));
        return;
      }
      if (event.key === "]") {
        studio.selection.forEach((id) => doc.moveObject(id, "forward"));
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (!studio.selection.length) return;
        event.preventDefault();
        const delta = event.shiftKey ? 10 : 1;
        const dx = event.key === "ArrowLeft" ? -delta : event.key === "ArrowRight" ? delta : 0;
        const dy = event.key === "ArrowUp" ? -delta : event.key === "ArrowDown" ? delta : 0;
        studio.selection.forEach((id) => {
          const object = doc.objects.find((item) => item.id === id);
          if (object && !object.locked) {
            doc.updateObject(id, { x: object.x + dx, y: object.y + dy });
          }
        });
      }
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") useStudioStore.getState().setSpacePressed(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
