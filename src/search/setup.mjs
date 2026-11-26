/**
 * The Astro config side of search. One mode per kind of content source:
 *
 *   static   any build-time source (Markdown): Astronomic Search indexes the built pages (src/search/static/)
 *   emdash   EmDash: its search plugin, set up in src/content/sources/emdash.setup.mjs (src/search/emdash/)
 *   request  any other server source: the source's own search, no dialog (src/search/request/)
 *
 * Pages import a mode's parts as `astronomic:search/Trigger.astro` and so on. An alias picks the folder, and not an
 * `if`: Vite resolves every import, also in a branch that never runs, and a mode's parts import modules that only its
 * own build has (`virtual:astronomic-search/assets` in a static build).
 */
import { fileURLToPath } from "node:url";

/** @param {{ name: string, output: string }} content What `contentSource()` returned. */
export async function searchSetup(content) {
	const mode = content.output === "static" ? "static" : content.name === "emdash" ? "emdash" : "request";
	return {
		mode,
		alias: { "astronomic:search": fileURLToPath(new URL(`./${mode}`, import.meta.url)) },
		integrations: mode === "static" ? [(await import("./static/integration.mjs")).default()] : [],
	};
}
