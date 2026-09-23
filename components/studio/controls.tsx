"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
      {children}
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="flex rounded-[10px] bg-bg p-0.5 ring-1 ring-hairline">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "flex-1 rounded-lg px-2 py-1.5 text-[12px] transition-colors duration-150",
            value === option.id
              ? "bg-raised text-bone"
              : "text-muted hover:text-bone",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const presets = ["#FFFFFF", "#000000", "#E8B86D", "#E07464", "#F5F2EA", "#4FA4D8"];
  return (
    <div className="flex items-center gap-2">
      <label className="relative h-8 w-8 overflow-hidden rounded-[10px] ring-1 ring-hairline">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute -inset-2 h-16 w-16"
        />
      </label>
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="h-5 w-5 rounded-full ring-1 ring-hairline"
          style={{ background: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
}

export function SliderField({
  value,
  min,
  max,
  step = 1,
  onChange,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onCommit?: () => void;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      onPointerDown={onCommit ? undefined : undefined}
      onPointerUp={onCommit}
    />
  );
}

export function IconButton({
  children,
  onClick,
  disabled,
  active,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-raised hover:text-bone disabled:opacity-30",
        active && "bg-raised text-bone",
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-[10px] bg-amber px-3 text-[13px] font-medium text-[#1a140c] transition-opacity duration-150 hover:opacity-90 disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-[10px] px-3 text-[13px] text-bone ring-1 ring-hairline transition-colors duration-150 hover:bg-raised disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}
