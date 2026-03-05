"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface CameraProps {
  timer: number;
  filter: string;
  onCapture: () => void;
}

export function Camera({ timer, filter, onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };
        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setReady(true);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const init = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      setCameras(videoDevices);
      if (videoDevices.length > 0) {
        startCamera(videoDevices[0].deviceId);
      }
    };
    init();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const next = (cameraIndex + 1) % cameras.length;
    setCameraIndex(next);
    startCamera(cameras[next].deviceId);
  };

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    // Flash
    const flash = document.getElementById("flash-overlay");
    flash?.classList.add("active");
    setTimeout(() => flash?.classList.remove("active"), 400);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;

    if (filter !== "none") {
      ctx.filter = filter;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");

    // Show preview briefly
    setPreview(dataUrl);
    setTimeout(() => setPreview(null), 2000);

    // Upload
    fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo: dataUrl }),
    })
      .then((res) => res.json())
      .then(() => onCapture())
      .catch((err) => console.error("Upload error:", err))
      .finally(() => setCapturing(false));
  }, [filter, onCapture]);

  const handleCapture = () => {
    if (capturing || !ready) return;
    setCapturing(true);

    if (timer > 0) {
      let count = Math.ceil(timer);
      setCountdown(count);
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(interval);
          setCountdown(null);
          takePhoto();
        }
      }, 1000);
    } else {
      takePhoto();
    }
  };

  // Spacebar capture
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !capturing) {
        e.preventDefault();
        handleCapture();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturing, ready, timer, filter]);

  return (
    <>
      <div id="flash-overlay" />
      <div
        className="relative overflow-hidden rounded-xl border"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        {/* Video / Preview */}
        <div className="relative aspect-video w-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
            style={{
              filter: filter !== "none" ? filter : undefined,
              display: preview ? "none" : "block",
            }}
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          )}

          {/* Countdown overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="relative flex items-center justify-center">
                <svg width="120" height="120" className="-rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeDasharray="283"
                    style={{
                      animation: `countdown-ring ${timer}s linear forwards`,
                    }}
                  />
                </svg>
                <span
                  className="absolute text-5xl font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {countdown}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div
          className="flex items-center justify-center gap-3 p-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--surface)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="inline-block mr-1"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Switch
            </button>
          )}

          <button
            onClick={handleCapture}
            disabled={capturing || !ready}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{
              backgroundColor: capturing ? "var(--muted)" : "var(--primary)",
            }}
            onMouseEnter={(e) => {
              if (!capturing)
                e.currentTarget.style.backgroundColor =
                  "var(--primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = capturing
                ? "var(--muted)"
                : "var(--primary)";
            }}
          >
            {capturing ? "Capturing..." : "Capture Photo"}
          </button>
        </div>
      </div>
    </>
  );
}
