import { getSupabase } from "@/lib/supabase";
import { registerAccount } from "@/lib/customAuth";
import type {
  Gender,
  StaffCategory,
  SupportDepartment,
  TeacherEmployment,
} from "@/lib/types";

export async function allocateStaffNumber(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("next_staff_no");
  if (error || !data) {
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

export async function registerTeacher(input: RegisterTeacherInput) {
  const sb = getSupabase();
  const staffNo = await allocateStaffNumber();

  const employment: TeacherEmployment = input.tscRegistered ? "TSC" : input.teacherEmployment;

  const { data: staffRow, error: staffErr } = await sb
    .from("staff")
    .insert({
      staff_no: staffNo,
      full_name: input.fullName,
      gender: input.gender,
      phone: input.phone,
      email: input.email ?? null,
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
    })
    .select("*")
    .single();

  if (staffErr) throw new Error(staffErr.message);

  const acc = await registerAccount({
    loginId: staffNo,
    password: input.password,
    fullName: input.fullName,
    role: "teacher",
    email: input.email,
  });
  if (!acc.ok) throw new Error(acc.error);

  await sb
    .from("profiles")
    .update({ staff_id: staffRow.id })
    .eq("id", acc.profile.id);

  await sb.from("activity_log").insert({
    actor: "Registrar",
    message: `Registered teacher ${input.fullName} (staff no. ${staffNo})`,
  });

  return { staffNo, staffId: staffRow.id as string };
}

export async function registerSupportStaff(input: RegisterSupportInput) {
  const sb = getSupabase();
  const staffNo = await allocateStaffNumber();

  const { data: staffRow, error: staffErr } = await sb
    .from("staff")
    .insert({
      staff_no: staffNo,
      full_name: input.fullName,
      gender: input.gender,
      phone: input.phone,
      email: input.email ?? null,
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
    })
    .select("*")
    .single();

  if (staffErr) throw new Error(staffErr.message);

  const acc = await registerAccount({
    loginId: staffNo,
    password: input.password,
    fullName: input.fullName,
    role: "staff",
    email: input.email,
  });
  if (!acc.ok) throw new Error(acc.error);

  await sb.from("profiles").update({ staff_id: staffRow.id }).eq("id", acc.profile.id);

  await sb.from("activity_log").insert({
    actor: "Registrar",
    message: `Registered support staff ${input.fullName} (${input.supportDepartment}, no. ${staffNo})`,
  });

  return { staffNo, staffId: staffRow.id as string };
}

export async function registerStudent(input: RegisterStudentInput) {
  const sb = getSupabase();

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

  const acc = await registerAccount({
    loginId: input.admissionNo,
    password: input.password,
    fullName: `${input.firstName} ${input.lastName}`,
    role: "student",
  });
  if (!acc.ok) throw new Error(acc.error);

  await sb.from("profiles").update({ student_id: student.id }).eq("id", acc.profile.id);

  await sb.from("activity_log").insert({
    actor: "Registrar",
    message: `Admitted student ${input.firstName} ${input.lastName} (${input.admissionNo})`,
  });

  return { admissionNo: input.admissionNo, studentId: student.id as string };
}

export async function registerParent(input: RegisterParentInput) {
  const sb = getSupabase();
  const loginId = input.phone.replace(/\D/g, "") || input.phone;

  const acc = await registerAccount({
    loginId,
    password: input.password,
    fullName: input.fullName,
    role: "parent",
    parentPhone: input.phone,
    email: input.email,
  });
  if (!acc.ok) throw new Error(acc.error);

  if (input.studentIds.length) {
    await sb.from("parent_students").insert(
      input.studentIds.map((student_id) => ({
        parent_profile_id: acc.profile.id,
        student_id,
        relationship: input.relationship ?? "Guardian",
      })),
    );
  }

  return { parentId: acc.profile.id };
}
