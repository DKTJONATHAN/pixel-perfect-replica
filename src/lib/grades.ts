import { letterGrade, average } from "@/lib/format";
import type { GradeRecord, StudentTermResult } from "@/lib/types";
import { SUBJECTS } from "@/lib/types";

/** Build term totals from individual subject scores (live calculation). */
export function computeTermResult(
  studentId: string,
  term: string,
  grades: GradeRecord[],
): StudentTermResult {
  const mine = grades.filter((g) => g.studentId === studentId && g.term === term);
  const subjects = SUBJECTS.map((subject) => {
    const row = mine.find((g) => g.subject === subject);
    const score = row?.score ?? 0;
    return { subject, score, grade: row ? letterGrade(score) : "—" };
  }).filter((s) => mine.some((g) => g.subject === s.subject) || s.score > 0);

  // Prefer only entered subjects for total
  const entered = mine.map((g) => ({
    subject: g.subject,
    score: g.score,
    grade: letterGrade(g.score),
  }));

  const list = entered.length ? entered : subjects;
  const scores = list.map((s) => s.score);
  const total = scores.reduce((a, b) => a + b, 0);
  const avg = scores.length ? Math.round(average(scores) * 10) / 10 : 0;

  return {
    studentId,
    term,
    subjects: list,
    total,
    average: avg,
    overallGrade: scores.length ? letterGrade(avg) : "—",
  };
}

export function classTermLeaderboard(
  studentIds: string[],
  term: string,
  grades: GradeRecord[],
) {
  return studentIds
    .map((id) => computeTermResult(id, term, grades))
    .sort((a, b) => b.average - a.average);
}
