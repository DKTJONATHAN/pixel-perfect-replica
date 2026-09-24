// Shared formatting, grading and CSV helpers.
import type { Database, GradeRecord, Student } from "@/lib/types";

export function money(amount: number, currency = "KES") {
  return `${currency} ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
}

export function fullName(s: Pick<Student, "firstName" | "lastName">) {
  return `${s.firstName} ${s.lastName}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function age(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function prettyDate(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Letter grade from a percentage score. */
export function letterGrade(score: number) {
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

export function gradeRemark(score: number) {
  if (score >= 80) return "Exceeding expectations";
  if (score >= 70) return "Meeting expectations";
  if (score >= 60) return "Approaching expectations";
  if (score >= 50) return "Needs support";
  return "Needs urgent support";
}

export function average(numbers: number[]) {
  if (!numbers.length) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

export function termAverage(grades: GradeRecord[]) {
  return Math.round(average(grades.map((g) => g.score)) * 10) / 10;
}

export function className(db: Database, classId: string) {
  const c = db.classes.find((x) => x.id === classId);
  return c ? `${c.name} ${c.stream}` : "Unassigned";
}

export function attendanceRate(present: number, total: number) {
  if (!total) return 0;
  return Math.round((present / total) * 1000) / 10;
}

/** Turn rows into a CSV string and trigger a browser download. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal CSV parser supporting quoted values. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (field !== "" || row.length) {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = "";
      }
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) {
    row.push(field.trim());
    rows.push(row);
  }
  const [headers, ...body] = rows;
  if (!headers) return [];
  return body.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = r[i] ?? "";
    });
    return obj;
  });
}
