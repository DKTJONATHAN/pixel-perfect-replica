import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Layout for /login/* — child routes render in the Outlet.
 * Hub lives at /login/ (login.index.tsx).
 */
export const Route = createFileRoute("/login")({
  component: () => <Outlet />,
});
