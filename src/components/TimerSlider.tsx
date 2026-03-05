"use client";

interface TimerSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function TimerSlider({ value, onChange }: TimerSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
          Timer
        </span>
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: "var(--primary)" }}
        >
          {value}s
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
      <div
        className="flex justify-between text-xs"
        style={{ color: "var(--muted)" }}
      >
        <span>0s</span>
        <span>10s</span>
      </div>
    </div>
  );
}
