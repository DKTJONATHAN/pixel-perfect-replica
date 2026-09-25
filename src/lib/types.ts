// Domain types for KidRight Academy (mapped from Supabase rows).

export type Role = "admin" | "staff" | "student";

export type StudentStatus = "Active" | "Transferred" | "Graduated" | "Suspended";
export type StaffStatus = "Active" | "On Leave" | "Terminated";
export type Gender = "Male" | "Female";
export type AttendanceStatus = "Present" | "Absent" | "Late";
export type EmploymentType = "Full-time" | "Part-time" | "Contract";
export type StaffRole =
  | "Teacher"
  | "Administrator"
  | "Accountant"
  | "Librarian"
  | "Support Staff";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string | null;
  staffId?: string | null;
}

export interface SchoolClass {
  id: string;
  name: string;
  stream: string;
  teacherId: string | null;
  feePerTerm: number;
}

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
  classId: string;
  photo?: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  medicalNotes: string;
  emergencyContact: string;
  admissionDate: string;
  status: StudentStatus;
  archived?: boolean;
}

export interface Staff {
  id: string;
  staffNo: string;
  fullName: string;
  gender: Gender;
  dob: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  photo?: string;
  role: StaffRole;
  department: string;
  qualifications: string;
  subjects: string[];
  employmentType: EmploymentType;
  dateJoined: string;
  salary: number;
  status: StaffStatus;
  archived?: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  classId: string;
  status: AttendanceStatus;
}

export interface StaffAttendanceRecord {
  id: string;
  date: string;
  staffId: string;
  status: AttendanceStatus;
}

export interface GradeRecord {
  id: string;
  studentId: string;
  term: string;
  subject: string;
  score: number;
}

export interface Payment {
  id: string;
  receiptNo: string;
  studentId: string;
  term: string;
  amount: number;
  date: string;
  method: "Cash" | "Bank" | "Mobile Money";
  note?: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  type: "Annual" | "Sick" | "Compassionate" | "Study";
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestedAt: string;
}

export interface Activity {
  id: string;
  at: string;
  actor: string;
  message: string;
}

export interface Settings {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  currentTerm: string;
  currency: string;
  annualLeaveDays: number;
  about: string;
  vision: string;
  mission: string;
}

export interface SchoolData {
  classes: SchoolClass[];
  students: Student[];
  staff: Staff[];
  attendance: AttendanceRecord[];
  staffAttendance: StaffAttendanceRecord[];
  grades: GradeRecord[];
  payments: Payment[];
  leave: LeaveRequest[];
  activity: Activity[];
  settings: Settings;
}

export const SUBJECTS = [
  "Mathematics",
  "English",
  "Kiswahili",
  "Science",
  "Social Studies",
  "Creative Arts",
];

export const TERMS = ["Term 1", "Term 2", "Term 3"];
