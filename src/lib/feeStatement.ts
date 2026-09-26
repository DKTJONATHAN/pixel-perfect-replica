// Per-learner fee statement and annual carry-forward calculations.
import { className, downloadCsv, fullName } from "@/lib/format";
import { TERMS, type SchoolData, type Student } from "@/lib/types";

export interface StudentFeeTerm {
  term: string;
  billed: number;
  paidAcrossAllTerms: number;
  allocatedPaid: number;
  balance: number;
  creditAfterTerm: number;
}

/**
 * Fees are treated as one annual ledger, not three isolated term accounts.
 * All payments count toward the learner's annual total regardless of the term
 * selected when the receipt was entered. Excess paid in an earlier term is
 * therefore carried forward automatically to the next term.
 */
export function studentFeeSummary(db: SchoolData, student: Student) {
  const cls = db.classes.find((c) => c.id === student.classId);
  const teacher = db.staff.find((s) => s.id === cls?.teacherId);
  const perTerm = cls?.feePerTerm ?? 0;
  const payments = db.payments.filter((p) => p.studentId === student.id);
  const totalPaid = payments.reduce((n, p) => n + p.amount, 0);
  let remainingPaid = totalPaid;

  const terms: StudentFeeTerm[] = TERMS.map((term) => {
    const billed = perTerm;
    const allocatedPaid = Math.min(remainingPaid, billed);
    const balance = Math.max(billed - allocatedPaid, 0);
    remainingPaid = Math.max(remainingPaid - billed, 0);
    return {
      term,
      billed,
      paidAcrossAllTerms: totalPaid,
      allocatedPaid,
      balance,
      creditAfterTerm: remainingPaid,
    };
  });

  const annualBilled = terms.reduce((n, t) => n + t.billed, 0);
  const annualArrears = Math.max(annualBilled - totalPaid, 0);
  const annualCredit = Math.max(totalPaid - annualBilled, 0);

  return {
    className: className(db, student.classId),
    classTeacher: teacher?.fullName ?? "Unassigned",
    terms,
    annualBilled,
    totalPaid,
    totalArrears: annualArrears,
    annualCredit,
    payments,
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
    ["Term", "Billed (" + cur + ")", "Allocated paid (" + cur + ")", "Arrears (" + cur + ")", "Credit carried (" + cur + ")"],
    ...s.terms.map((t) => [t.term, t.billed, t.allocatedPaid, t.balance, t.creditAfterTerm]),
    ["Annual total", s.annualBilled, s.totalPaid, s.totalArrears, s.annualCredit],
    [],
    ["Receipt", "Entered term", "Date", "Method", "Amount (" + cur + ")"],
    ...s.payments.map((p) => [p.receiptNo, p.term, p.date, p.method, p.amount]),
  ];
  downloadCsv("fee-statement-" + student.admissionNo + ".csv", [db.settings.schoolName, "Annual fee statement"], rows);
}