import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy catch-all — admin sections live under /admin/$section. */
export const Route = createFileRoute("/$section")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/admin/$section", params: { section: params.section } });
  },
  component: () => null,
});
