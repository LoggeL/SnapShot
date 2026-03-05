import { NextRequest, NextResponse } from "next/server";
import { readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const PHOTOS_DIR = path.join(process.cwd(), "photos");

// GET /api/photos/[filename] - serve a photo
export async function GET(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  const filePath = path.join(PHOTOS_DIR, filename);

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read photo" }, { status: 500 });
  }
}

// DELETE /api/photos/[filename] - delete a photo
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  const filePath = path.join(PHOTOS_DIR, filename);

  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await unlink(filePath);
    return NextResponse.json({ message: "Photo deleted" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
