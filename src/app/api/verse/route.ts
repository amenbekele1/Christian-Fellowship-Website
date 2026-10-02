import { NextResponse } from "next/server";
import { getVerseOfDay } from "@/lib/verse";

export async function GET() {
  return NextResponse.json(getVerseOfDay());
}
