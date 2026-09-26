import { getSupabase } from "@/lib/supabase";
import type {
  Activity,
  AttendanceRecord,
  GradeRecord,
  LeaveRequest,
  Payment,
  SchoolClass,
  SchoolData,
  Settings,
  Staff,
  StaffAttendanceRecord,
  Student,
} from "@/lib/types";

const emptySettings: Settings = {
  schoolName: "KidRight Academy",
  motto: "Learn. Grow. Shine.",
  address: "12 Riverside Lane, Nairobi",
  phone: "+254 700 123 456",
  email: "office@kidright.ac.ke",
  academicYear: "2026",
  currentTerm: "Term 3",
  currency: "KES",
  annualLeaveDays: 21,
  about:
    "KidRight Academy is a modern primary school committed to academic excellence, character formation, and holistic development of every learner.",
  vision:
    "To nurture confident, curious, and compassionate learners who shape a better Kenya.",
  mission:
    "Provide quality, inclusive education grounded in integrity, creativity, and community.",
};

export async function fetchSchoolSettings(): Promise<Settings> {
  const sb = getSupabase();
  const { data, error } = await sb.from("school_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return emptySettings;
  return {
    schoolName: data.school_name,
    motto: data.motto,
    address: data.address,
    phone: data.phone,
    email: data.email,
    academicYear: data.academic_year,
    currentTerm: data.current_term,
    currency: data.currency,
    annualLeaveDays: data.annual_leave_days,
    about: data.about,
    vision: data.vision,
    mission: data.mission,
  };
}

export async function fetchSchoolData(): Promise<SchoolData> {
  const sb = getSupabase();
  const [
    settings,
    classesRes,
    studentsRes,
    staffRes,
    attendanceRes,
    gradesRes,
    paymentsRes,
    leaveRes,
    activityRes,
    staffAttendanceRes,
    dutyRes,
    assignRes,
  ] = await Promise.all([
    fetchSchoolSettings(),
    sb.from("classes").select("*").order("name"),
    sb.from("students").select("*").order("admission_no"),
    sb.from("staff").select("*").order("staff_no"),
    sb.from("attendance").select("*").order("date", { ascending: false }).limit(500),
    sb.from("grades").select("*").limit(500),
    sb.from("payments").select("*").order("date", { ascending: false }).limit(200),
    sb.from("leave_requests").select("*").order("requested_at", { ascending: false }),
    sb.from("activity_log").select("*").order("at", { ascending: false }).limit(40),
    sb.from("staff_attendance").select("*").order("date", { ascending: false }).limit(500),
    // These tables come from the 006 SQL script; if not run yet they simply return empty.
    sb.from("duty_roster").select("*").order("week_start", { ascending: false }).limit(200),
    sb.from("teaching_assignments").select("*"),
  ]);

  const classes: SchoolClass[] = (classesRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    stream: c.stream,
    teacherId: c.teacher_id,
    feePerTerm: Number(c.fee_per_term),
  }));

  const students: Student[] = (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    admissionNo: s.admission_no,
    firstName: s.first_name,
    lastName: s.last_name,
    dob: s.dob ?? "",
    gender: s.gender,
    classId: s.class_id ?? "",
    photo: s.photo_url ?? undefined,
    guardianName: s.guardian_name ?? "",
    guardianPhone: s.guardian_phone ?? "",
    guardianEmail: s.guardian_email ?? "",
    address: s.address ?? "",
    medicalNotes: s.medical_notes ?? "",
    emergencyContact: s.emergency_contact ?? "",
    admissionDate: s.admission_date,
    status: s.status as Student["status"],
    archived: s.archived,
  }));

  const staff: Staff[] = (staffRes.data ?? []).map((m) => ({
    id: m.id,
    staffNo: m.staff_no,
    fullName: m.full_name,
    gender: m.gender,
    dob: m.dob ?? "",
    nationalId: m.national_id ?? "",
    phone: m.phone ?? "",
    email: m.email ?? "",
    address: m.address ?? "",
    photo: m.photo_url ?? undefined,
    role: m.role as Staff["role"],
    department: m.department,
    qualifications: m.qualifications ?? "",
    subjects: m.subjects ?? [],
    employmentType: m.employment_type as Staff["employmentType"],
    dateJoined: m.date_joined,
    salary: Number(m.salary),
    status: m.status as Staff["status"],
    archived: m.archived,
    staffCategory: (m.staff_category as Staff["staffCategory"]) ?? "Support",
    teacherEmployment: (m.teacher_employment as Staff["teacherEmployment"]) ?? null,
    tscRegistered: Boolean(m.tsc_registered),
    tscNumber: m.tsc_number,
    supportDepartment: (m.support_department as Staff["supportDepartment"]) ?? null,
    loginEmail: m.login_email,
  }));

  const attendance: AttendanceRecord[] = (attendanceRes.data ?? []).map((a) => ({
    id: a.id,
    date: a.date,
    studentId: a.student_id,
    classId: a.class_id ?? "",
    status: a.status as AttendanceRecord["status"],
  }));

  const grades: GradeRecord[] = (gradesRes.data ?? []).map((g) => ({
    id: g.id,
    studentId: g.student_id,
    term: g.term,
    subject: g.subject,
    score: Number(g.score),
  }));

  const payments: Payment[] = (paymentsRes.data ?? []).map((p) => ({
    id: p.id,
    receiptNo: p.receipt_no,
    studentId: p.student_id,
    term: p.term,
    amount: Number(p.amount),
    date: p.date,
    method: p.method as Payment["method"],
    note: p.note ?? undefined,
  }));

  const leave: LeaveRequest[] = (leaveRes.data ?? []).map((l) => ({
    id: l.id,
    staffId: l.staff_id,
    type: l.type as LeaveRequest["type"],
    from: l.date_from,
    to: l.date_to,
    days: l.days,
    reason: l.reason,
    status: l.status as LeaveRequest["status"],
    requestedAt: l.requested_at,
  }));

  const activity: Activity[] = (activityRes.data ?? []).map((a) => ({
    id: a.id,
    at: a.at,
    actor: a.actor,
    message: a.message,
  }));

  const staffAttendance: StaffAttendanceRecord[] = (staffAttendanceRes.data ?? []).map((a) => ({
    id: a.id,
    date: a.date,
    staffId: a.staff_id,
    status: a.status as StaffAttendanceRecord["status"],
  }));

  return {
    settings,
    classes,
    students,
    staff,
    attendance,
    staffAttendance,
    grades,
    payments,
    leave,
    activity,
  };
}

export async function logActivity(actor: string, message: string) {
  const sb = getSupabase();
  await sb.from("activity_log").insert({ actor, message });
}
