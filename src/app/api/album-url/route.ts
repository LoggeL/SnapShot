import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.IMMICH_BASE_URL;
  const albumId = process.env.IMMICH_ALBUM_ID;

  if (!baseUrl || !albumId) {
    return NextResponse.json(
      { error: "Immich album URL not configured" },
      { status: 503 }
    );
  }

  const cleanBase = baseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const albumUrl = `${cleanBase}/albums/${albumId}`;

  return NextResponse.json({ album_url: albumUrl });
}
