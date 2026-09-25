import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — send users to the correct portal after login. */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
