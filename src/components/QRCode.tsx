"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";

export function QRCode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [albumUrl, setAlbumUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      try {
        const res = await fetch("/api/album-url");
        if (!res.ok) throw new Error("Not configured");
        const data = await res.json();
        setAlbumUrl(data.album_url);
      } catch {
        setError(true);
      }
    };
    fetchUrl();
  }, []);

  useEffect(() => {
    if (albumUrl && canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, albumUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: "#18181b",
          light: "#ffffff",
        },
      }).catch(() => setError(true));
    }
  }, [albumUrl]);

  if (error) {
    return (
      <div
        className="rounded-lg border p-4 text-center"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "var(--border)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          QR Code unavailable
        </p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Configure Immich to enable
        </p>
      </div>
    );
  }

  if (!albumUrl) return null;

  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
    >
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        Album Access
      </h2>
      <div className="flex justify-center rounded-md bg-white p-2">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
