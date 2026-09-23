"use client";

import dynamic from "next/dynamic";

const StudioShell = dynamic(() => import("./StudioShell"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-bg">
      <p className="font-serif text-3xl italic text-bone">Atelier</p>
    </div>
  ),
});

export function StudioLoader() {
  return <StudioShell />;
}
