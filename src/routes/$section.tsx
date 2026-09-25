import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Catch-all for unknown single segments.
 * Do NOT steal /login, /signup, /student, /staff, /admin, /parent — those have real routes.
 */
const RESERVED = new Set([
  "login",
  "signup",
  "student",
  "staff",
  "admin",
  "parent",
  "dashboard",
]);

export const Route = createFileRoute("/$section")({
  beforeLoad: ({ params }) => {
    const s = params.section?.toLowerCase?.() ?? "";
    if (RESERVED.has(s)) {
      // Let the real static route handle these (should never match, but safe).
      return;
    }
    throw redirect({ to: "/" });
  },
  component: () => null,
});
