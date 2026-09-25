import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

export const Route = createFileRoute("/login/staff")({
  component: () => <LoginForm role="staff" title="Staff portal" />,
});
