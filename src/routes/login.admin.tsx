import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

export const Route = createFileRoute("/login/admin")({
  component: () => <LoginForm role="admin" title="Admin portal" />,
});
