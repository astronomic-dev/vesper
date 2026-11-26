/**
 * Static builds: the search index, read from the built pages and written to dist/_search/. A page that is off, a draft
 * and a noindex page are never in it: they are not built, or they say so in their head. The lists and the other
 * structural pages are left out by their routes (src/utils/routes.ts), so a new post, project or page needs no line
 * here. In `astro dev` nothing is built, so the search is empty there.
 *
 * A pattern matches a path with as many segments, "*" is any one segment: each route needs one per length.
 */
import search, { html } from "@astronomic-dev/search/astro";
import { strings } from "../../theme.strings.ts";

/** The pages that show other pages, and the design system's. */
const STRUCTURAL = [
	"/",
	"/search",
	"/articles",
	"/articles/page/*",
	"/articles/category/*",
	"/articles/category/*/page/*",
	"/tags/*",
	"/tags/*/page/*",
	"/projects",
	"/system",
	"/system/*",
];

const t = strings.search;

export default () =>
	search({
		sources: [
			html({ type: "posts", label: t.groups.posts, include: ["/articles/*"] }),
			html({ type: "projects", label: t.groups.projects, include: ["/projects/*"] }),
			// The rest: the pages collection's, /speaking, /uses and /now, and any page a site adds in src/pages/.
			html({ type: "pages", label: t.groups.pages, exclude: [...STRUCTURAL, "/articles/*", "/projects/*"] }),
		],
		strings: t.dialog,
		browse: [
			{ label: t.articles, href: "/articles" },
			{ label: t.home, href: "/" },
		],
	});
