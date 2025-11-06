import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import * as XLSX from "xlsx";

type TrajectoryRow = {
  Timestamp: string;
  Tractor_ID: string;
  X_Pos_m: number;
  Y_Pos_m: number;
  Speed_kmh?: number;
  Rotation_deg?: number;
  Fork_Position?: number;
} & Record<string, unknown>;

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

// GET /api/trajectory
// Reads the Excel file from Supabase Storage and returns parsed rows
export async function GET(_req: NextRequest) {
  try {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "trajectory-data";
    // Prefer hyphenated filename per spec; try underscore fallback if not found
    const preferredKey = "tractor-trajectory_nov6.xlsx";
    const fallbackKey = "tractor_trajectory_nov6.xlsx";

    // Try preferred
    let download = await supabase.storage.from(bucket).download(preferredKey);
    if (download.error || !download.data) {
      download = await supabase.storage.from(bucket).download(fallbackKey);
      if (download.error || !download.data) {
        return NextResponse.json(
          { error: `Excel file not found in bucket '${bucket}'. Checked '${preferredKey}' and '${fallbackKey}'.` },
          { status: 404 }
        );
      }
    }

    const arrayBuffer = await download.data.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      return NextResponse.json({ error: "No sheet found in Excel file" }, { status: 400 });
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: undefined });

    const rows: TrajectoryRow[] = rawRows.map((r) => ({
      Timestamp: String(r["Timestamp"] ?? ""),
      Tractor_ID: String(r["Tractor_ID"] ?? ""),
      X_Pos_m: normalizeNumber(r["X_Pos_m"]) ?? 0,
      Y_Pos_m: normalizeNumber(r["Y_Pos_m"]) ?? 0,
      Speed_kmh: normalizeNumber(r["Speed_kmh"]) ?? undefined,
      Rotation_deg: normalizeNumber(r["Rotation_deg"]) ?? undefined,
      Fork_Position: normalizeNumber(r["Fork_Position"]) ?? undefined,
      // Preserve original column names with special characters
      ...(r["Fuel_Level_%"] !== undefined ? { ["Fuel_Level_%"]: normalizeNumber(r["Fuel_Level_%"]) } : {}),
      ...(r["Engine_Temp_C"] !== undefined ? { ["Engine_Temp_C"]: normalizeNumber(r["Engine_Temp_C"]) } : {}),
      ...(r["Hydraulic_Pressure_bar"] !== undefined ? { ["Hydraulic_Pressure_bar"]: normalizeNumber(r["Hydraulic_Pressure_bar"]) } : {}),
    }));

    return NextResponse.json({ rows });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to parse Excel" }, { status: 500 });
  }
}

