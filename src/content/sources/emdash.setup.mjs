/**
 * Astro setup for the EmDash source: server output, the Node adapter, the `emdash()` integration and the search
 * plugin (Astronomic Search: `search()` builds the index from the content, `searchFiles()` serves the dialog's files;
 * it goes after `emdash()`). The plugin searches what the theme's own search does (src/content/search-scope.ts): the
 * talks on /speaking, the items on /uses and a post's category and tags too. Turning a page off in src/theme.config.ts
 * takes it out of the index at the next build. Imports are dynamic, so projects that
 * use another source do not need these packages.
 */
import { searchPluginOptions } from "../search-scope.ts";
import { getConfig } from "../../utils/config.ts";

export default async function setup() {
	const [{ default: node }, { default: emdash, local }, { sqlite }, { search }, { searchFiles }] = await Promise.all([
		import("@astrojs/node"),
		import("emdash/astro"),
		import("emdash/db"),
		import("@astronomic-dev/search/emdash"),
		import("@astronomic-dev/search/emdash/astro"),
	]);
	return {
		output: "server",
		adapter: node({ mode: "standalone" }),
		integrations: [
			emdash({
				// EMDASH_DATABASE_URL lets a deploy or a test point at another database.
				database: sqlite({ url: process.env.EMDASH_DATABASE_URL || "file:./data.db" }),
				// baseUrl must match `mediaBaseUrl` in the adapter (the default does).
				storage: local({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" }),
				plugins: [search(searchPluginOptions(getConfig().config))],
			}),
			searchFiles(),
		],
	};
}
