// Per-learner fee statement export (CSV opens in Excel).
import { className, downloadCsv, fullName } from "@/lib/format";
import { TERMS, type SchoolData, type Student } from "@/lib/types";

export function studentFeeSummary(db: SchoolData, student: Student) {
  const cls = db.classes.find((c) => c.id === student.classId);
  const teacher = db.staff.find((s) => s.id === cls?.teacherId);
  const perTerm = cls?.feePerTerm ?? 0;
  const terms = TERMS.map((term) => {
    const paid = db.payments
      .filter((p) => p.studentId === student.id && p.term === term)
      .reduce((n, p) => n + p.amount, 0);
    return { term, billed: perTerm, paid, balance: Math.max(perTerm - paid, 0) };
  });
  return {
    className: className(db, student.classId),
    classTeacher: teacher?.fullName ?? "Unassigned",
    terms,
    totalPaid: terms.reduce((n, t) => n + t.paid, 0),
    totalArrears: terms.reduce((n, t) => n + t.balance, 0),
    payments: db.payments.filter((p) => p.studentId === student.id),
  };
}

export function exportStudentFeeStatement(db: SchoolData, student: Student) {
  const s = studentFeeSummary(db, student);
  const cur = db.settings.currency;
  const rows: (string | number)[][] = [
    ["Learner", fullName(student)],
    ["Admission No", student.admissionNo],
    ["Class", s.className],
    ["Class teacher", s.classTeacher],
    ["Parent / guardian", student.guardianName || "—"],
    ["Parent phone", student.guardianPhone || "—"],
    ["Parent email", student.guardianEmail || "—"],
    ["Academic year", db.settings.academicYear],
    [],
    ["Term", `Billed (${cur})`, `Paid (${cur})`, `Arrears (${cur})`],
    ...s.terms.map((t) => [t.term, t.billed, t.paid, t.balance]),
    ["Total", s.terms.reduce((n, t) => n + t.billed, 0), s.totalPaid, s.totalArrears],
    [],
    ["Receipt", "Term", "Date", "Method", `Amount (${cur})`],
    ...s.payments.map((p) => [p.receiptNo, p.term, p.date, p.method, p.amount]),
  ];
  downloadCsv(`fee-statement-${student.admissionNo}.csv`, [db.settings.schoolName, "Fee statement"], rows);
}
