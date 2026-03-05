"use client";

import { useState } from "react";

interface PhotoCardProps {
  filename: string;
  onDelete: () => void;
}

export function PhotoCard({ filename, onDelete }: PhotoCardProps) {
  const [confirm, setConfirm] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/api/photos/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 3000);
      return;
    }
    onDelete();
  };

  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg border transition-all hover:shadow-lg"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <img
        src={`/api/photos/${filename}`}
        alt={filename}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex w-full items-center justify-between p-2">
          <span className="truncate text-xs text-white/80 font-mono">
            {filename}
          </span>
          <div className="flex gap-1">
            <button
              onClick={handleDownload}
              className="rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/20"
              title="Download"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md p-1.5 transition-colors"
              style={{
                color: confirm ? "#ef4444" : "rgba(255,255,255,0.9)",
                backgroundColor: confirm ? "rgba(239,68,68,0.2)" : "transparent",
              }}
              title={confirm ? "Click again to confirm" : "Delete"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
