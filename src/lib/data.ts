/**
 * Server-side deterministic loaders for the static JSON layer.
 * Import only from Server Components (uses node:fs).
 */
import fs from "node:fs";
import path from "node:path";
import type { ExecutiveBrief, MetaData, Signal } from "./types";

function readJson<T>(fileName: string): T {
  const filePath = path.join(process.cwd(), "data", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function getSignals(): Signal[] {
  return readJson<Signal[]>("signals.json");
}

export function getMeta(): MetaData {
  return readJson<MetaData>("meta.json");
}

export function getBriefs(): ExecutiveBrief[] {
  return readJson<ExecutiveBrief[]>("briefs.json");
}
