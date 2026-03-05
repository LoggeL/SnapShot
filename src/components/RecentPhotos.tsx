"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentPhotosProps {
  refreshKey: number;
}

export function RecentPhotos({ refreshKey }: RecentPhotosProps) {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/photos")
      .then((r) => r.json())
      .then((data: string[]) => setPhotos(data.slice(0, 6)))
      .catch(() => {});
  }, [refreshKey]);

  if (photos.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Recent Photos
        </h3>
        <Link
          href="/gallery"
          className="text-xs font-medium transition-colors"
          style={{ color: "var(--primary)" }}
        >
          View all
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {photos.map((filename) => (
          <div
            key={filename}
            className="group relative aspect-square overflow-hidden rounded-lg"
            style={{ backgroundColor: "var(--surface)" }}
          >
            <img
              src={`/api/photos/${filename}`}
              alt={filename}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
