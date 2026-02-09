import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getCurrentUserEmail } from "@/lib/clerk";
import { isAdmin } from "@/lib/auth";

const BUCKET = "blog-assets";
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_PDF = "application/pdf";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(request: Request) {
  const userEmail = await getCurrentUserEmail();
  if (!isAdmin(userEmail ?? undefined)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const type = file.type;
  const isImage = ALLOWED_IMAGE_TYPES.includes(type);
  const isPdf = type === ALLOWED_PDF;
  if (!isImage && !isPdf) {
    return NextResponse.json(
      { error: "Allowed: images (JPEG, PNG, GIF, WebP) or PDF" },
      { status: 400 }
    );
  }
  const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${isPdf ? "20" : "10"}MB)` },
      { status: 400 }
    );
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${Date.now()}-${safeName}`;

  // In server/Node the FormData File may not be a real File; convert to Buffer for Supabase
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const supabase = getSupabaseAdmin();
  let result = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: type,
    upsert: false,
  });

  if (result.error) {
    const msg = result.error.message ?? "";
    if (msg.includes("Bucket not found") || msg.includes("does not exist") || msg.includes("404")) {
      try {
        await supabase.storage.createBucket(BUCKET, {
          public: true,
          fileSizeLimit: MAX_PDF_BYTES,
          allowedMimeTypes: [...ALLOWED_IMAGE_TYPES, ALLOWED_PDF],
        });
        result = await supabase.storage.from(BUCKET).upload(path, buffer, {
          contentType: type,
          upsert: false,
        });
      } catch {
        return NextResponse.json(
          { error: `Storage bucket "${BUCKET}" not found. Create a public bucket named "${BUCKET}" in Supabase Dashboard → Storage.` },
          { status: 502 }
        );
      }
    }
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }

  const data = result.data;
  if (!data?.path) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl });
}
