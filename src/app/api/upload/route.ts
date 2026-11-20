import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/config";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
];

const MAX_SIZE_BYTES = Number(process.env.MAX_FILE_SIZE_MB ?? 10) * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "evidence";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type ${file.type} not allowed` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File exceeds maximum size of ${process.env.MAX_FILE_SIZE_MB ?? 10} MB` },
      { status: 400 }
    );
  }

  // Sanitise folder name
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "").toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const fileName = `${randomBytes(16).toString("hex")}.${ext}`;

  const uploadDir = path.join(process.env.UPLOAD_DIR ?? "./public/uploads", safeFolder);
  await mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, fileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const fileUrl = `/uploads/${safeFolder}/${fileName}`;

  return NextResponse.json({
    fileUrl,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });
}

// Config: allow up to 15MB body
export const config = {
  api: {
    bodyParser: false,
  },
};
