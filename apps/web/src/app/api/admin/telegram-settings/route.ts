import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src/data");
const SETTINGS_FILE = path.join(DATA_DIR, "telegram_settings.json");

export async function GET() {
  try {
    const fileData = await fs.readFile(SETTINGS_FILE, "utf-8");
    const settings = JSON.parse(fileData);
    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json({ success: true, data: {} });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
