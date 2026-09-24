// Realistic seed data. Generated deterministically so the app looks alive on
// first run. Replace with a real API later (see src/services/db.ts).
import type {
  Activity,
  AttendanceRecord,
  Database,
  GradeRecord,
  LeaveRequest,
  Payment,
  SchoolClass,
  Staff,
  StaffAttendanceRecord,
  Student,
  User,
} from "@/lib/types";
import { SUBJECTS, TERMS } from "@/lib/types";

/** Tiny deterministic pseudo-random generator so seed data never shifts. */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}
const rnd = makeRandom(20260924);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

const iso = (d: Date) => d.toISOString().slice(0, 10);
export const today = () => iso(new Date());

const firstNamesM = [
  "Brian", "Kevin", "Samuel", "Joseph", "Daniel", "Elijah", "Ryan", "Victor",
  "Peter", "Ian", "Collins", "Mark",
];
const firstNamesF = [
  "Amina", "Grace", "Faith", "Mercy", "Joy", "Cynthia", "Zawadi", "Naomi",
  "Linda", "Sharon", "Esther", "Wanjiru",
];
const lastNames = [
  "Otieno", "Kamau", "Mwangi", "Achieng", "Njoroge", "Wafula", "Chebet",
  "Kariuki", "Omondi", "Mutiso", "Barasa", "Njeri", "Kiplagat", "Muthoni",
];
const streets = ["Riverside Lane", "Kilimani Road", "Ngong Avenue", "Westlands Drive", "Karen Close"];

export const CLASSES: SchoolClass[] = [
  { id: "c1", name: "Grade 1", stream: "Blue", teacherId: "s1", feePerTerm: 18000 },
  { id: "c2", name: "Grade 2", stream: "Blue", teacherId: "s2", feePerTerm: 19000 },
  { id: "c3", name: "Grade 3", stream: "Yellow", teacherId: "s3", feePerTerm: 21000 },
  { id: "c4", name: "Grade 4", stream: "Blue", teacherId: "s4", feePerTerm: 23000 },
  { id: "c5", name: "Grade 5", stream: "Yellow", teacherId: "s5", feePerTerm: 25000 },
  { id: "c6", name: "Grade 6", stream: "Blue", teacherId: "s6", feePerTerm: 27000 },
];

export const STAFF: Staff[] = [
  ["s1", "Grace Wanjiku", "Female", "Teacher", "Lower Primary", ["Mathematics", "Science"]],
  ["s2", "Peter Odhiambo", "Male", "Teacher", "Lower Primary", ["English", "Kiswahili"]],
  ["s3", "Miriam Chebet", "Female", "Teacher", "Lower Primary", ["Science", "Creative Arts"]],
  ["s4", "Daniel Kiprop", "Male", "Teacher", "Upper Primary", ["Mathematics"]],
  ["s5", "Susan Atieno", "Female", "Teacher", "Upper Primary", ["English", "Social Studies"]],
  ["s6", "Felix Mutua", "Male", "Teacher", "Upper Primary", ["Science", "Mathematics"]],
  ["s7", "Alice Njoki", "Female", "Administrator", "Administration", []],
  ["s8", "Hassan Ali", "Male", "Accountant", "Finance", []],
  ["s9", "Beatrice Kilonzo", "Female", "Librarian", "Library", []],
  ["s10", "Joseph Barasa", "Male", "Support Staff", "Operations", []],
  ["s11", "Cynthia Mwikali", "Female", "Teacher", "Upper Primary", ["Kiswahili"]],
  ["s12", "Robert Kimani", "Male", "Administrator", "Administration", []],
].map(([id, fullName, gender, role, department, subjects], i) => ({
  id: id as string,
  staffNo: `KRA/STF/${String(i + 1).padStart(3, "0")}`,
  fullName: fullName as string,
  gender: gender as Staff["gender"],
  dob: iso(new Date(1980 + (i % 12), (i * 3) % 12, 5 + (i % 20))),
  nationalId: `2${String(2340000 + i * 7919).slice(0, 7)}`,
  phone: `+2547${String(10000000 + i * 913571).slice(0, 8)}`,
  email: `${(fullName as string).toLowerCase().split(" ")[0]}.${(fullName as string).toLowerCase().split(" ")[1]}@kidright.ac.ke`,
  address: `${10 + i} ${streets[i % streets.length]}, Nairobi`,
  role: role as Staff["role"],
  department: department as string,
  qualifications:
    role === "Teacher"
      ? "B.Ed (Primary Education), TSC registered"
      : role === "Accountant"
        ? "B.Com Finance, CPA(K)"
        : "Diploma in Business Administration",
  subjects: subjects as string[],
  employmentType: (i % 5 === 4 ? "Contract" : i % 7 === 6 ? "Part-time" : "Full-time") as Staff["employmentType"],
  dateJoined: iso(new Date(2016 + (i % 8), (i * 2) % 12, 10)),
  salary: role === "Teacher" ? 62000 + i * 1500 : role === "Support Staff" ? 32000 : 78000 + i * 1200,
  status: (i === 9 ? "On Leave" : "Active") as Staff["status"],
}));

function makeStudents(): Student[] {
  const list: Student[] = [];
  for (let i = 0; i < 34; i++) {
    const gender = i % 2 === 0 ? "Female" : "Male";
    const firstName = gender === "Female" ? pick(firstNamesF) : pick(firstNamesM);
    const lastName = pick(lastNames);
    const cls = CLASSES[i % CLASSES.length];
    const gradeNumber = Number(cls.name.split(" ")[1]);
    list.push({
      id: `st${i + 1}`,
      admissionNo: `KRA/2026/${String(i + 1).padStart(4, "0")}`,
      firstName,
      lastName,
      dob: iso(new Date(2026 - (gradeNumber + 6), int(0, 11), int(1, 28))),
      gender,
      classId: cls.id,
      guardianName: `${pick([...firstNamesM, ...firstNamesF])} ${lastName}`,
      guardianPhone: `+2547${String(20000000 + i * 733121).slice(0, 8)}`,
      guardianEmail: `${lastName.toLowerCase()}.family${i + 1}@example.com`,
      address: `${20 + i} ${pick(streets)}, Nairobi`,
      medicalNotes: i % 9 === 0 ? "Mild asthma — inhaler kept at the clinic." : "None reported.",
      emergencyContact: `+2547${String(30000000 + i * 519377).slice(0, 8)}`,
      admissionDate: iso(new Date(2026 - (gradeNumber - 1), 0, 9)),
      status:
        i === 31 ? "Transferred" : i === 32 ? "Suspended" : i === 33 ? "Graduated" : "Active",
    });
  }
  return list;
}

export const STUDENTS = makeStudents();

/** Last 14 weekdays, newest last. */
export function recentSchoolDays(count: number): string[] {
  const days: string[] = [];
  const d = new Date();
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.unshift(iso(new Date(d)));
    d.setDate(d.getDate() - 1);
  }
  return days;
}

function makeAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const days = recentSchoolDays(14);
  STUDENTS.filter((s) => s.status === "Active").forEach((s) => {
    days.forEach((day) => {
      const r = rnd();
      const status = r > 0.93 ? "Absent" : r > 0.88 ? "Late" : "Present";
      records.push({ id: `${s.id}-${day}`, date: day, studentId: s.id, classId: s.classId, status });
    });
  });
  return records;
}

function makeStaffAttendance(): StaffAttendanceRecord[] {
  const records: StaffAttendanceRecord[] = [];
  recentSchoolDays(10).forEach((day) => {
    STAFF.forEach((m) => {
      const r = rnd();
      records.push({
        id: `${m.id}-${day}`,
        date: day,
        staffId: m.id,
        status: r > 0.95 ? "Absent" : r > 0.9 ? "Late" : "Present",
      });
    });
  });
  return records;
}

function makeGrades(): GradeRecord[] {
  const grades: GradeRecord[] = [];
  STUDENTS.forEach((s) => {
    TERMS.slice(0, 2).forEach((term) => {
      SUBJECTS.forEach((subject) => {
        grades.push({
          id: `${s.id}-${term}-${subject}`,
          studentId: s.id,
          term,
          subject,
          score: int(42, 97),
        });
      });
    });
  });
  return grades;
}

function makePayments(): Payment[] {
  const payments: Payment[] = [];
  let n = 1;
  STUDENTS.forEach((s) => {
    const cls = CLASSES.find((c) => c.id === s.classId)!;
    const paid = rnd();
    const amount = paid > 0.75 ? cls.feePerTerm : Math.round((cls.feePerTerm * (0.4 + rnd() * 0.5)) / 500) * 500;
    payments.push({
      id: `p${n}`,
      receiptNo: `RCT-${String(n).padStart(4, "0")}`,
      studentId: s.id,
      term: "Term 1",
      amount,
      date: iso(new Date(2026, 0, int(10, 28))),
      method: pick(["Cash", "Bank", "Mobile Money"] as const),
    });
    n++;
  });
  return payments;
}

const LEAVE: LeaveRequest[] = [
  {
    id: "l1", staffId: "s10", type: "Sick", from: "2026-09-21", to: "2026-09-26", days: 5,
    reason: "Admitted for a minor operation, doctor's note attached.",
    status: "Approved", requestedAt: "2026-09-18",
  },
  {
    id: "l2", staffId: "s3", type: "Annual", from: "2026-10-05", to: "2026-10-09", days: 5,
    reason: "Family holiday during the half-term break.", status: "Pending", requestedAt: "2026-09-22",
  },
  {
    id: "l3", staffId: "s8", type: "Compassionate", from: "2026-09-29", to: "2026-09-30", days: 2,
    reason: "Funeral arrangements upcountry.", status: "Pending", requestedAt: "2026-09-23",
  },
  {
    id: "l4", staffId: "s5", type: "Study", from: "2026-08-12", to: "2026-08-16", days: 5,
    reason: "Masters residential sessions.", status: "Rejected", requestedAt: "2026-08-01",
  },
];

const ACTIVITY: Activity[] = [
  { id: "a1", at: new Date(Date.now() - 36e5).toISOString(), actor: "Alice Njoki", message: "Recorded a fee payment of 12,000 for Grade 4" },
  { id: "a2", at: new Date(Date.now() - 7.2e6).toISOString(), actor: "Grace Wanjiku", message: "Marked attendance for Grade 1 Blue" },
  { id: "a3", at: new Date(Date.now() - 1.1e7).toISOString(), actor: "Robert Kimani", message: "Admitted a new student to Grade 2 Blue" },
  { id: "a4", at: new Date(Date.now() - 8.8e7).toISOString(), actor: "Hassan Ali", message: "Generated the September payroll summary" },
];

export const USERS: User[] = [
  { id: "u1", name: "Robert Kimani", email: "admin@kidright.ac.ke", role: "admin", staffId: "s12" },
  { id: "u2", name: "Grace Wanjiku", email: "teacher@kidright.ac.ke", role: "teacher", staffId: "s1" },
  { id: "u3", name: "Alice Njoki", email: "registrar@kidright.ac.ke", role: "registrar", staffId: "s7" },
];

export function seedDatabase(): Database {
  return {
    classes: CLASSES,
    students: STUDENTS,
    staff: STAFF,
    attendance: makeAttendance(),
    staffAttendance: makeStaffAttendance(),
    grades: makeGrades(),
    payments: makePayments(),
    leave: LEAVE,
    activity: ACTIVITY,
    users: USERS,
    settings: {
      schoolName: "KidRight Academy",
      motto: "Learn. Grow. Shine.",
      address: "12 Riverside Lane, Nairobi",
      phone: "+254 700 123 456",
      email: "office@kidright.ac.ke",
      academicYear: "2026",
      currentTerm: "Term 3",
      currency: "KES",
      annualLeaveDays: 21,
    },
  };
}
