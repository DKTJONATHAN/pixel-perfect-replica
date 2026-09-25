import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AttendanceRegister } from "@/components/AttendanceRegister";

export const Route = createFileRoute("/admin/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance register — KidRight Academy" },
      {
        name: "description",
        content: "Administrators review and record daily attendance for every KidRight class.",
      },
      { property: "og:title", content: "Attendance register — KidRight Academy" },
      {
        property: "og:description",
        content: "Administrators review and record daily attendance for every KidRight class.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAttendance,
});

function AdminAttendance() {
  return (
    <AppShell
      portal="admin"
      title="Attendance register"
      subtitle="Record or correct attendance for any class and date."
      requires="attendance.mark"
    >
      <AttendanceRegister />
    </AppShell>
  );
}
