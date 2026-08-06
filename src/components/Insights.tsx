import { useRouterState } from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Kept out of the shell so router state changes do not re-render the whole tree.
export default function Insights() {
  const route = useRouterState({
    select: (state) => state.matches.at(-1)?.fullPath ?? null,
  });
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <>
      <Analytics route={route} path={path} />
      <SpeedInsights route={route} />
    </>
  );
}
