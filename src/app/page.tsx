"use client";

import { Camera } from "@/components/Camera";
import { TimerSlider } from "@/components/TimerSlider";
import { FilterSelector } from "@/components/FilterSelector";
import { QRCode } from "@/components/QRCode";
import { RecentPhotos } from "@/components/RecentPhotos";
import { useState, useCallback } from "react";

export default function CameraPage() {
  const [timer, setTimer] = useState(3);
  const [filter, setFilter] = useState("none");
  const [refreshKey, setRefreshKey] = useState(0);

  const onCapture = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: "var(--surface-elevated)",
              borderColor: "var(--border)",
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              Controls
            </h2>
            <TimerSlider value={timer} onChange={setTimer} />
          </div>

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
              Filters
            </h2>
            <FilterSelector value={filter} onChange={setFilter} />
          </div>

          <QRCode />
        </aside>

        {/* Main camera area */}
        <div className="flex flex-col gap-6">
          <Camera timer={timer} filter={filter} onCapture={onCapture} />
          <RecentPhotos refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
