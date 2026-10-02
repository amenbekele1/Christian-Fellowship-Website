import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { teamAuth, isTeamAuthError } from "@/lib/team-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function getFileCategory(mime: string): string {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "doc";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(`upload:${ip}`, 20, 60 * 60 * 1000)).allowed) {
    return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
  }

  const auth = await teamAuth(params.teamId);
  if (isTeamAuthError(auth)) return auth;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobPath = `teams/${params.teamId}/${Date.now()}-${safeName}`;

  const blob = await put(blobPath, file, { access: "public" });

  return NextResponse.json({
    url: blob.url,
    fileName: file.name,
    fileType: getFileCategory(file.type),
  });
}
