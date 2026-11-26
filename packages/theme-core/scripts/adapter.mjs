/**
 * The adapter runner (a theme's `pnpm test:adapter`).
 *
 * Tests the selected content source: CONTENT_SOURCE if set, otherwise the one
 * astro.config.mjs selects. Builds it with the conformance route into a temp
 * out dir, serves it, prints /_conformance.json problems and the theme's page
 * assertion problems, exits 1 on any. With CONTENT_SOURCE set, the built site
 * must name that source. Never modifies source files.
 *
 * It builds the copy as it is: a buyer's copy as that buyer's site, the repo's
 * own theme (with its demo-brand folder) as the hosted demo. So it refuses
 * `hostedDemo` (harness.mjs), which would test a buyer's copy as the demo.
 *
 * `config`: `root` (the project root), `assertPages(kind, harness)` (returns
 * problems), and optionally `port` and `paritySkip` (see createHarness).
 */
import { createHarness, printAssertions, printConformance } from "./harness.mjs";

export async function runAdapter(config) {
	if (config.hostedDemo) {
		console.error("hostedDemo is for a run that compares sources (test-parity.mjs): test:adapter builds this copy as it is. Take it out of the shared config.");
		process.exit(1);
	}
	const h = createHarness(config);
	const source = process.env.CONTENT_SOURCE;
	const outDir = h.tempDir("dist-test-adapter");
	let failed = true;

	try {
		console.log(`=== ${source ?? "selected source (astro.config.mjs)"} ===`);
		if ((await h.build(outDir, { source })) !== 0) throw new Error("Build failed.");
		const server = await h.serve(outDir);
		try {
			const result = await h.conformance(source);
			printConformance(result);
			const pageProblems = await config.assertPages(server.kind, h);
			printAssertions(pageProblems);
			failed = result.problems.length > 0 || pageProblems.length > 0;
		} finally {
			server.stop();
		}
	} catch (err) {
		console.error(err.message);
	} finally {
		h.cleanup();
	}
	process.exit(failed ? 1 : 0);
}
