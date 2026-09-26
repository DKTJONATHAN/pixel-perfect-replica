// Shared formatting, grading and CSV helpers.
import { TERMS, type GradeRecord, type SchoolClass, type SchoolData, type Student } from "@/lib/types";

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

export function className(
  db: Pick<SchoolData, "classes"> | { classes: SchoolClass[] },
  classId: string,
) {
  const c = db.classes.find((x) => x.id === classId);
  return c ? `${c.name} ${c.stream}` : "Unassigned";
}

export function attendanceRate(present: number, total: number) {
  if (!total) return 0;
  return Math.round((present / total) * 1000) / 10;
}

function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(v: string | number) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ].join("\n");
  triggerDownload(filename, csv, "text/csv;charset=utf-8");
}

/**
 * A single, complete CSV for one student — profile, fee payments, exam
 * results, and attendance — so a teacher, the registrar, or the student
 * themselves can pull the whole record in one click instead of hunting
 * across separate screens. Sections are separated by a blank line and a
 * "== NAME ==" marker row, which spreadsheet apps read fine as plain rows.
 */
export function exportStudentRecord(
  db: {
    classes: { id: string; name: string; stream: string; feePerTerm: number }[];
    grades: { studentId: string; term: string; subject: string; score: number }[];
    payments: {
      studentId: string;
      receiptNo: string;
      term: string;
      amount: number;
      date: string;
      method: string;
    }[];
    attendance: { studentId: string; date: string; status: string }[];
    settings: { currency: string };
  },
  student: {
    id: string;
    admissionNo: string;
    firstName: string;
    lastName: string;
    classId: string;
    status: string;
    guardianName: string;
    guardianPhone: string;
  },
) {
  const cls = db.classes.find((c) => c.id === student.classId);
  const grades = db.grades.filter((g) => g.studentId === student.id);
  const payments = db.payments.filter((p) => p.studentId === student.id);
  const attendance = db.attendance.filter((a) => a.studentId === student.id);
  const paid = payments.reduce((a, p) => a + p.amount, 0);
  const annualBilled = (cls?.feePerTerm ?? 0) * TERMS.length;
  const annualArrears = Math.max(annualBilled - paid, 0);
  const annualCredit = Math.max(paid - annualBilled, 0);
  const present = attendance.filter((a) => a.status === "Present").length;

  const lines: string[] = [];
  const section = (title: string) => {
    if (lines.length) lines.push("");
    lines.push(`== ${title} ==`);
  };
  const row = (cells: (string | number)[]) => lines.push(cells.map(csvEscape).join(","));

  section("PROFILE");
  row(["Name", `${student.firstName} ${student.lastName}`]);
  row(["Admission No", student.admissionNo]);
  row(["Class", cls ? `${cls.name} ${cls.stream}` : "Unassigned"]);
  row(["Status", student.status]);
  row(["Guardian", student.guardianName]);
  row(["Guardian phone", student.guardianPhone]);

  section("FEES");
  row(["Annual fee", annualBilled]);
  row(["Total paid", paid]);
  row(["Arrears", annualArrears]);
  row(["Credit", annualCredit]);
  row([]);
  row(["Receipt", "Term", "Amount", "Method", "Date"]);
  payments.forEach((p) => row([p.receiptNo, p.term, p.amount, p.method, p.date]));

  section("RESULTS");
  row(["Term", "Subject", "Score"]);
  grades.forEach((g) => row([g.term, g.subject, g.score]));

  section("ATTENDANCE");
  row(["Present", present]);
  row(["Total recorded", attendance.length]);
  row([]);
  row(["Date", "Status"]);
  attendance.forEach((a) => row([a.date, a.status]));

  triggerDownload(`${student.admissionNo}-record.csv`, lines.join("\n"), "text/csv;charset=utf-8");
}
