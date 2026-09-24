// Service layer. Everything the UI needs goes through these functions, so
// swapping localStorage for a real REST API means rewriting only this file
// (make the functions async and fetch() instead of reading from storage).
import type { Database } from "@/lib/types";
import { seedDatabase } from "@/data/seed";

const STORAGE_KEY = "kidright.db.v1";

let cache: Database | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

/** Read the whole database, seeding on first use. */
export function loadDb(): Database {
  if (cache) return cache;
  if (!isBrowser()) {
    cache = seedDatabase();
    return cache;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as Database;
      return cache;
    }
  } catch {
    // Corrupt storage: fall through and reseed.
  }
  cache = seedDatabase();
  saveDb(cache);
  return cache;
}

export function saveDb(db: Database) {
  cache = db;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked — the in-memory cache still works this session.
  }
}

export function resetDb(): Database {
  const fresh = seedDatabase();
  saveDb(fresh);
  return fresh;
}

export function newId(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/** Next admission number, e.g. KRA/2026/0035 */
export function nextAdmissionNo(db: Database) {
  const year = db.settings.academicYear;
  const nums = db.students
    .map((s) => Number(s.admissionNo.split("/").pop()))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `KRA/${year}/${String(next).padStart(4, "0")}`;
}

/** Next staff number, e.g. KRA/STF/013 */
export function nextStaffNo(db: Database) {
  const nums = db.staff
    .map((s) => Number(s.staffNo.split("/").pop()))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `KRA/STF/${String(next).padStart(3, "0")}`;
}

export function nextReceiptNo(db: Database) {
  const nums = db.payments
    .map((p) => Number(p.receiptNo.split("-").pop()))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `RCT-${String(next).padStart(4, "0")}`;
}

export const STORAGE_KEY_NAME = STORAGE_KEY;
