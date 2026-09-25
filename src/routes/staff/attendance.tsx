import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { AttendanceRegister } from "@/components/AttendanceRegister";

export const Route = createFileRoute("/staff/attendance")({
  head: () => ({
    meta: [
      { title: "Mark attendance — KidRight Academy" },
      {
        name: "description",
        content: "Teachers mark daily class attendance for KidRight Academy learners.",
      },
      { property: "og:title", content: "Mark attendance — KidRight Academy" },
      {
        property: "og:description",
        content: "Teachers mark daily class attendance for KidRight Academy learners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffAttendance,
});

function StaffAttendance() {
  return (
    <AppShell
      portal="staff"
      title="Mark attendance"
      subtitle="Pick a class and date, then tap each learner's status."
      requires="attendance.mark"
    >
      <AttendanceRegister />
    </AppShell>
  );
}
