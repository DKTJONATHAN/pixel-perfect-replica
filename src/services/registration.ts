import { getSupabase } from "@/lib/supabase";
import type {
  Gender,
  StaffCategory,
  SupportDepartment,
  TeacherEmployment,
} from "@/lib/types";

/** Synthetic auth emails so users can log in with staff/admission numbers. */
export function staffAuthEmail(staffNo: string) {
  return `${staffNo}@staff.kidright.internal`;
}

export function studentAuthEmail(admissionNo: string) {
  const safe = admissionNo.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  return `${safe}@student.kidright.internal`;
}

export function parentAuthEmail(phoneOrEmail: string) {
  if (phoneOrEmail.includes("@")) return phoneOrEmail.trim().toLowerCase();
  const digits = phoneOrEmail.replace(/\D/g, "");
  return `${digits}@parent.kidright.internal`;
}

export async function allocateStaffNumber(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("next_staff_no");
  if (error || !data) {
    // Fallback: random unique-looking 10-digit (collision checked by unique constraint)
    const n = String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999));
    return n.padStart(10, "0").slice(0, 10);
  }
  return String(data);
}

export interface RegisterTeacherInput {
  fullName: string;
  gender: Gender;
  phone: string;
  email?: string;
  nationalId?: string;
  subjects: string[];
  tscRegistered: boolean;
  tscNumber?: string;
  teacherEmployment: TeacherEmployment;
  password: string;
  dateJoined?: string;
}

export interface RegisterSupportInput {
  fullName: string;
  gender: Gender;
  phone: string;
  email?: string;
  nationalId?: string;
  supportDepartment: SupportDepartment;
  roleLabel: string;
  password: string;
  dateJoined?: string;
}

export interface RegisterStudentInput {
  firstName: string;
  lastName: string;
  gender: Gender;
  classId: string;
  admissionNo: string;
  password: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail?: string;
  dob?: string;
  address?: string;
}

export interface RegisterParentInput {
  fullName: string;
  phone: string;
  email?: string;
  password: string;
  studentIds: string[];
  relationship?: string;
}

async function createAuthUser(email: string, password: string, meta: Record<string, string>) {
  const sb = getSupabase();
  // Registrar uses signUp; in production prefer inviteUserByEmail with service role.
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: meta },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Auth user was not created");
  return data.user;
}

export async function registerTeacher(input: RegisterTeacherInput) {
  const sb = getSupabase();
  const staffNo = await allocateStaffNumber();
  const loginEmail = staffAuthEmail(staffNo);

  const employment: TeacherEmployment = input.tscRegistered ? "TSC" : input.teacherEmployment;

  const { data: staffRow, error: staffErr } = await sb
    .from("staff")
    .insert({
      staff_no: staffNo,
      full_name: input.fullName,
      gender: input.gender,
      phone: input.phone,
      email: input.email ?? loginEmail,
      national_id: input.nationalId ?? null,
      role: "Teacher",
      department: "Teaching",
      subjects: input.subjects,
      staff_category: "Teacher" satisfies StaffCategory,
      teacher_employment: employment,
      tsc_registered: input.tscRegistered,
      tsc_number: input.tscRegistered ? input.tscNumber ?? null : null,
      employment_type: "Full-time",
      date_joined: input.dateJoined ?? new Date().toISOString().slice(0, 10),
      salary: 0,
      status: "Active",
      login_email: loginEmail,
    })
    .select("*")
    .single();

  if (staffErr) throw new Error(staffErr.message);

  const user = await createAuthUser(loginEmail, input.password, {
    full_name: input.fullName,
    role: "teacher",
  });

  await sb.from("profiles").upsert({
    id: user.id,
    email: loginEmail,
    full_name: input.fullName,
    role: "teacher",
    staff_id: staffRow.id,
    login_id: staffNo,
  });

  await sb.from("activity_log").insert({
    actor: "Registrar",
    message: `Registered teacher ${input.fullName} (staff no. ${staffNo})`,
  });

  return { staffNo, staffId: staffRow.id as string, loginEmail };
}

export async function registerSupportStaff(input: RegisterSupportInput) {
  const sb = getSupabase();
  const staffNo = await allocateStaffNumber();
  const loginEmail = staffAuthEmail(staffNo);

  const { data: staffRow, error: staffErr } = await sb
    .from("staff")
    .insert({
      staff_no: staffNo,
      full_name: input.fullName,
      gender: input.gender,
      phone: input.phone,
      email: input.email ?? loginEmail,
      national_id: input.nationalId ?? null,
      role: input.roleLabel,
      department: input.supportDepartment,
      subjects: [],
      staff_category: "Support",
      support_department: input.supportDepartment,
      tsc_registered: false,
      employment_type: "Full-time",
      date_joined: input.dateJoined ?? new Date().toISOString().slice(0, 10),
      salary: 0,
      status: "Active",
      login_email: loginEmail,
    })
    .select("*")
    .single();

  if (staffErr) throw new Error(staffErr.message);

  const user = await createAuthUser(loginEmail, input.password, {
    full_name: input.fullName,
    role: "staff",
  });

  await sb.from("profiles").upsert({
    id: user.id,
    email: loginEmail,
    full_name: input.fullName,
    role: "staff",
    staff_id: staffRow.id,
    login_id: staffNo,
  });

  await sb.from("activity_log").insert({
    actor: "Registrar",
    message: `Registered support staff ${input.fullName} (${input.supportDepartment}, no. ${staffNo})`,
  });

  return { staffNo, staffId: staffRow.id as string, loginEmail };
}

export async function registerStudent(input: RegisterStudentInput) {
  const sb = getSupabase();
  const loginEmail = studentAuthEmail(input.admissionNo);

  const { data: student, error: stErr } = await sb
    .from("students")
    .insert({
      admission_no: input.admissionNo,
      first_name: input.firstName,
      last_name: input.lastName,
      gender: input.gender,
      class_id: input.classId,
      guardian_name: input.guardianName,
      guardian_phone: input.guardianPhone,
      guardian_email: input.guardianEmail ?? null,
      dob: input.dob ?? null,
      address: input.address ?? null,
      admission_date: new Date().toISOString().slice(0, 10),
      status: "Active",
    })
    .select("*")
    .single();

  if (stErr) throw new Error(stErr.message);

  const user = await createAuthUser(loginEmail, input.password, {
    full_name: `${input.firstName} ${input.lastName}`,
    role: "student",
  });

  await sb.from("profiles").upsert({
    id: user.id,
    email: loginEmail,
    full_name: `${input.firstName} ${input.lastName}`,
    role: "student",
    student_id: student.id,
    login_id: input.admissionNo,
  });

  await sb.from("activity_log").insert({
    actor: "Registrar",
    message: `Admitted student ${input.firstName} ${input.lastName} (${input.admissionNo})`,
  });

  return { admissionNo: input.admissionNo, studentId: student.id as string, loginEmail };
}

export async function registerParent(input: RegisterParentInput) {
  const sb = getSupabase();
  const loginEmail = parentAuthEmail(input.email || input.phone);

  const user = await createAuthUser(loginEmail, input.password, {
    full_name: input.fullName,
    role: "parent",
  });

  await sb.from("profiles").upsert({
    id: user.id,
    email: loginEmail,
    full_name: input.fullName,
    role: "parent",
    login_id: input.phone.replace(/\D/g, ""),
    parent_phone: input.phone,
  });

  if (input.studentIds.length) {
    await sb.from("parent_students").insert(
      input.studentIds.map((student_id) => ({
        parent_profile_id: user.id,
        student_id,
        relationship: input.relationship ?? "Guardian",
      })),
    );
  }

  return { parentId: user.id, loginEmail };
}
