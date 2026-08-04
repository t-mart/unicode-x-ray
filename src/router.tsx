import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { commonNameChunk, nameChunkQuery } from "./lib/unicode-query.ts";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
	});

	if (!import.meta.env.SSR) {
		void queryClient.prefetchQuery(nameChunkQuery(commonNameChunk));
	}

	const router = createTanStackRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
