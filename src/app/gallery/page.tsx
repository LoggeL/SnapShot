"use client";

import { useEffect, useState } from "react";
import { PhotoCard } from "@/components/PhotoCard";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPhotos = async () => {
    try {
      const res = await fetch("/api/photos");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const handleDelete = async (filename: string) => {
    try {
      const res = await fetch(`/api/photos/${filename}`, { method: "DELETE" });
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p !== filename));
      }
    } catch (err) {
      console.error("Failed to delete photo:", err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
            Gallery
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {photos.length} photo{photos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--border)", borderTopColor: "transparent" }}
          />
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: "var(--muted)" }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            No photos yet. Take some with the camera!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((filename) => (
            <PhotoCard
              key={filename}
              filename={filename}
              onDelete={() => handleDelete(filename)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
