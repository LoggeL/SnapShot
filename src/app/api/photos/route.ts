import { NextRequest, NextResponse } from "next/server";
import { readdir, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const PHOTOS_DIR = path.join(process.cwd(), "photos");

async function ensurePhotosDir() {
  if (!existsSync(PHOTOS_DIR)) {
    await mkdir(PHOTOS_DIR, { recursive: true });
  }
}

// GET /api/photos - list all photos
export async function GET() {
  try {
    await ensurePhotosDir();
    const files = await readdir(PHOTOS_DIR);
    const photos = files
      .filter((f) =>
        /\.(png|jpg|jpeg|gif|webp)$/i.test(f)
      )
      .sort()
      .reverse();
    return NextResponse.json(photos);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/photos - save a photo
export async function POST(request: NextRequest) {
  try {
    await ensurePhotosDir();
    const body = await request.json();
    const { photo } = body;

    if (!photo || !photo.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image data" },
        { status: 400 }
      );
    }

    const [, base64Data] = photo.split(",", 2);
    const buffer = Buffer.from(base64Data, "base64");

    const timestamp = Date.now();
    const filename = `photo-${timestamp}.png`;
    const filePath = path.join(PHOTOS_DIR, filename);

    await writeFile(filePath, buffer);

    // Upload to Immich if configured
    const immichUrl = process.env.IMMICH_BASE_URL;
    const immichKey = process.env.IMMICH_API_KEY;
    const immichAlbum = process.env.IMMICH_ALBUM_ID;

    if (immichUrl && immichKey && immichAlbum) {
      uploadToImmich(filePath, filename, immichUrl, immichKey, immichAlbum).catch(
        (err) => console.error("Immich upload failed:", err)
      );
    }

    return NextResponse.json({
      message: `Photo saved: ${filename}`,
      path: `/api/photos/${filename}`,
    });
  } catch (err) {
    console.error("Save error:", err);
    return NextResponse.json(
      { error: "Failed to save photo" },
      { status: 500 }
    );
  }
}

async function uploadToImmich(
  filePath: string,
  filename: string,
  baseUrl: string,
  apiKey: string,
  albumId: string
) {
  const { readFile, stat } = await import("fs/promises");
  const fileBuffer = await readFile(filePath);
  const fileStat = await stat(filePath);

  const formData = new FormData();
  formData.append(
    "assetData",
    new Blob([fileBuffer], { type: "image/png" }),
    filename
  );
  formData.append(
    "deviceAssetId",
    `${filename}-${Math.floor(fileStat.mtimeMs)}`
  );
  formData.append("deviceId", "nextjs-snapshot");
  formData.append(
    "fileCreatedAt",
    new Date(fileStat.ctimeMs).toISOString()
  );
  formData.append(
    "fileModifiedAt",
    new Date(fileStat.mtimeMs).toISOString()
  );
  formData.append("isFavorite", "false");

  const uploadRes = await fetch(`${baseUrl}/assets`, {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: formData,
  });

  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

  const asset = await uploadRes.json();
  if (asset.id) {
    await fetch(`${baseUrl}/albums/${albumId}/assets`, {
      method: "PUT",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: [asset.id] }),
    });
  }
}
