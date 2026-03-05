"use client";

const FILTERS = [
  { id: "none", label: "None", value: "none" },
  { id: "grayscale", label: "B&W", value: "grayscale(100%)" },
  { id: "sepia", label: "Sepia", value: "sepia(100%)" },
  { id: "invert", label: "Invert", value: "invert(100%)" },
  { id: "contrast", label: "Vivid", value: "contrast(150%) saturate(130%)" },
  { id: "blur", label: "Soft", value: "blur(1px) brightness(110%)" },
];

interface FilterSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function FilterSelector({ value, onChange }: FilterSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.value)}
          className="rounded-md px-3 py-2 text-xs font-medium transition-all"
          style={{
            backgroundColor:
              value === f.value ? "var(--primary)" : "var(--surface)",
            color: value === f.value ? "#fff" : "var(--fg)",
            border: `1px solid ${value === f.value ? "var(--primary)" : "var(--border)"}`,
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
