import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/LoginForm";

export const Route = createFileRoute("/login/parent")({
  component: () => <LoginForm role="parent" title="Parent portal" />,
});
