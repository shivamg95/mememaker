"use client";

import { GhostButton, PrimaryButton } from "@/components/studio/controls";

export function CropOverlay({
  onCancel,
  onApply,
}: {
  onCancel: () => void;
  onApply: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-[16px] bg-surface/90 p-2 ring-1 ring-hairline backdrop-blur-md">
      <GhostButton onClick={onCancel}>Cancel</GhostButton>
      <PrimaryButton onClick={onApply}>Apply crop</PrimaryButton>
    </div>
  );
}
