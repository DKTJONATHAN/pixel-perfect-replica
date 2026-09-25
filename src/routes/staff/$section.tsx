import { createFileRoute, redirect } from "@tanstack/react-router";

/** Reuse admin section UI under /staff/* for shared list views. */
export const Route = createFileRoute("/staff/$section")({
  beforeLoad: ({ params }) => {
    const allowed = ["students", "attendance", "grades", "classes"];
    if (!allowed.includes(params.section)) {
      throw redirect({ to: "/staff" });
    }
  },
  component: () => {
    // Lazy: import admin section component pattern inline via navigation to same data
    const AdminSection = require("../admin/$section").Route.options.component;
    return AdminSection ? <AdminSection /> : null;
  },
});
