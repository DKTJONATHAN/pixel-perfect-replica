import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button, Card, Input, Select, Tabs, TabPanel } from "@/components/UI";
import { useSchool } from "@/context/SchoolProvider";
import {
  SUBJECTS,
  SUPPORT_DEPARTMENTS,
  type Gender,
  type SupportDepartment,
  type TeacherEmployment,
} from "@/lib/types";
import {
  registerParent,
  registerStudent,
  registerSupportStaff,
  registerTeacher,
} from "@/services/registration";

export const Route = createFileRoute("/admin/register")({
  component: RegistrarPage,
});

function RegistrarPage() {
  return (
    <AppShell
      portal="admin"
      title="Registration"
      subtitle="Register teachers, support staff, students and parents after employment or admission."
    >
      <Tabs
        tabs={[
          { value: "teacher", label: "Teacher" },
          { value: "support", label: "Support staff" },
          { value: "student", label: "Student" },
          { value: "parent", label: "Parent" },
        ]}
      >
        <TabPanel value="teacher">
          <TeacherForm />
        </TabPanel>
        <TabPanel value="support">
          <SupportForm />
        </TabPanel>
        <TabPanel value="student">
          <StudentForm />
        </TabPanel>
        <TabPanel value="parent">
          <ParentForm />
        </TabPanel>
      </Tabs>
    </AppShell>
  );
}

function TeacherForm() {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("Female");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [tscRegistered, setTscRegistered] = useState(false);
  const [tscNumber, setTscNumber] = useState("");
  const [employment, setEmployment] = useState<TeacherEmployment>("BOM");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggleSubject(s: string) {
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subjects.length === 0) {
      toast.error("Select at least one teaching subject");
      return;
    }
    if (tscRegistered && !tscNumber.trim()) {
      toast.error("Enter TSC number");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await registerTeacher({
        fullName,
        gender,
        phone,
        email: email || undefined,
        nationalId: nationalId || undefined,
        subjects,
        tscRegistered,
        tscNumber: tscNumber || undefined,
        teacherEmployment: employment,
        password,
      });
      setResult(`Teacher registered. Staff number: ${res.staffNo} (use this to sign in).`);
      toast.success("Teacher registered");
      setFullName("");
      setPassword("");
      setSubjects([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-display text-lg font-medium">Register teacher</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        System assigns a unique 10-digit staff number. Teacher signs in with staff number + password.
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Full name">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </Select>
        </Field>
        <Field label="Phone">
          <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email (optional)">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="National ID (optional)">
          <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
        </Field>
        <Field label="Initial password">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Subject combination</p>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubject(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  subjects.includes(s)
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2 space-y-3 rounded-xl border border-border p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={tscRegistered}
              onChange={(e) => setTscRegistered(e.target.checked)}
            />
            TSC registered
          </label>
          {tscRegistered ? (
            <Field label="TSC number">
              <Input required value={tscNumber} onChange={(e) => setTscNumber(e.target.value)} />
            </Field>
          ) : (
            <Field label="Employment (non-TSC)">
              <Select
                value={employment}
                onChange={(e) => setEmployment(e.target.value as TeacherEmployment)}
              >
                <option value="BOM">BOM teacher</option>
                <option value="PTA">PTA teacher</option>
              </Select>
            </Field>
          )}
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" loading={loading}>
            Register teacher
          </Button>
          {result && <p className="mt-3 text-sm font-medium text-success">{result}</p>}
        </div>
      </form>
    </Card>
  );
}

function SupportForm() {
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<Gender>("Female");
  const [phone, setPhone] = useState("");
  const [dept, setDept] = useState<SupportDepartment>("Kitchen");
  const [roleLabel, setRoleLabel] = useState("Cook");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const roleSuggestions = useMemo(() => {
    const map: Record<SupportDepartment, string[]> = {
      Kitchen: ["Cook", "Caterer"],
      Cleaning: ["Cleaner"],
      Transport: ["Driver"],
      Security: ["Security"],
      Clinic: ["Nurse"],
      Library: ["Librarian"],
      Accounts: ["Accountant"],
      Administration: ["Administrator", "Registrar"],
      Grounds: ["Grounds staff"],
      Other: ["Support Staff"],
    };
    return map[dept] ?? ["Support Staff"];
  }, [dept]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await registerSupportStaff({
        fullName,
        gender,
        phone,
        supportDepartment: dept,
        roleLabel,
        password,
      });
      setResult(`Staff registered. Staff number: ${res.staffNo}`);
      toast.success("Support staff registered");
      setFullName("");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-display text-lg font-medium">Register support staff</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Cleaners, cooks, drivers, security and other non-teaching staff. Unique 10-digit staff number
        assigned automatically.
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Full name">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </Select>
        </Field>
        <Field label="Phone">
          <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Department">
          <Select
            value={dept}
            onChange={(e) => {
              const d = e.target.value as SupportDepartment;
              setDept(d);
              setRoleLabel(
                ({ Kitchen: "Cook", Cleaning: "Cleaner", Transport: "Driver", Security: "Security" } as Record<
                  string,
                  string
                >)[d] ?? "Support Staff",
              );
            }}
          >
            {SUPPORT_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Job title">
          <Select value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)}>
            {roleSuggestions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
            <option value="Support Staff">Support Staff</option>
          </Select>
        </Field>
        <Field label="Initial password">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" loading={loading}>
            Register staff
          </Button>
          {result && <p className="mt-3 text-sm font-medium text-success">{result}</p>}
        </div>
      </form>
    </Card>
  );
}

function StudentForm() {
  const { db } = useSchool();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender>("Female");
  const [classId, setClassId] = useState(db.classes[0]?.id ?? "");
  const [admissionNo, setAdmissionNo] = useState("");
  const [password, setPassword] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) {
      toast.error("Select a class / stream");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await registerStudent({
        firstName,
        lastName,
        gender,
        classId,
        admissionNo,
        password,
        guardianName,
        guardianPhone,
      });
      setResult(`Student admitted. Admission no: ${res.admissionNo}`);
      toast.success("Student registered");
      setFirstName("");
      setLastName("");
      setPassword("");
      setAdmissionNo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-display text-lg font-medium">Register student</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Registrar assigns admission number and class/stream. Student signs in with admission number +
        password.
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="First name">
          <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <Field label="Last name">
          <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </Field>
        <Field label="Gender">
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
          </Select>
        </Field>
        <Field label="Class / stream">
          <Select required value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Select…</option>
            {db.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.stream}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Admission number">
          <Input
            required
            value={admissionNo}
            onChange={(e) => setAdmissionNo(e.target.value)}
            placeholder="e.g. KRA/2026/0001"
          />
        </Field>
        <Field label="Initial password">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Guardian name">
          <Input required value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
        </Field>
        <Field label="Guardian phone">
          <Input required value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" loading={loading}>
            Register student
          </Button>
          {result && <p className="mt-3 text-sm font-medium text-success">{result}</p>}
        </div>
      </form>
    </Card>
  );
}

function ParentForm() {
  const { db } = useSchool();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggleStudent(id: string) {
    setStudentIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentIds.length) {
      toast.error("Link at least one student");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      await registerParent({
        fullName,
        phone,
        email: email || undefined,
        password,
        studentIds,
      });
      setResult("Parent account created and linked to selected students.");
      toast.success("Parent registered");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-display text-lg font-medium">Register parent / guardian</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Parents sign in with phone or email to view linked children&apos;s performance and fees.
      </p>
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <Field label="Full name">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email (optional)">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Initial password">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium">Link students</p>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {db.students
              .filter((s) => s.status === "Active")
              .map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={studentIds.includes(s.id)}
                    onChange={() => toggleStudent(s.id)}
                  />
                  {s.firstName} {s.lastName} · {s.admissionNo}
                </label>
              ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" loading={loading}>
            Register parent
          </Button>
          {result && <p className="mt-3 text-sm font-medium text-success">{result}</p>}
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
