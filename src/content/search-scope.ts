/**
 * What the site search covers, for every source: the collections and their routes, and the list pages that are a hit
 * each. `src/content/search.ts` searches by it, and the EmDash search plugin's options come from it
 * (`searchPluginOptions`), so both leave out the same pages.
 *
 * Plain Node loads this file (src/content/sources/emdash.setup.mjs runs in the Astro config), so it imports only files
 * Node can load, with their extensions.
 */
import { strings } from "../theme.strings.ts";
import type { Config } from "../utils/config.ts";
import { linkOn, OPTIONAL_ROUTES, pageHref, POST_ROUTES, postHref, projectHref, THEME_ROUTES } from "../utils/routes.ts";
import { listHead, type ListPage, sectionOf } from "../utils/sections.ts";
import type { Talk, UsesItem } from "./model.ts";

/** The searched model collections, in hit order, with each one's EmDash collection slug. */
export const SEARCH_COLLECTIONS = {
	posts: "posts",
	projects: "projects",
	pages: "pages",
} as const;

export type SearchCollection = keyof typeof SEARCH_COLLECTIONS;

/** Each searched collection's entry route (src/utils/routes.ts). */
export const SEARCH_ROUTES: Record<SearchCollection, (slug: string) => string> = {
	posts: postHref,
	projects: projectHref,
	pages: pageHref,
};

/**
 * The list pages that are one hit each: /speaking and /uses, as a static build indexes them. /projects is not one: its
 * projects are the hits, and its pages entry only words the list.
 */
export const HIT_LIST_PAGES = ["speaking", "uses"] as const satisfies readonly ListPage[];
export type HitListPage = (typeof HIT_LIST_PAGES)[number];

type ListFields = { speaking: { collection: "talks"; fields: readonly (keyof Talk)[] }; uses: { collection: "uses"; fields: readonly (keyof UsesItem)[] } };

/**
 * The collection each of those pages lists, and the fields of an entry a search finds the page by. The names
 * are the same in the model and in EmDash.
 */
export const HIT_LIST_FIELDS = {
	speaking: { collection: "talks", fields: ["title", "event", "place", "summary"] },
	uses: { collection: "uses", fields: ["group", "name", "note"] },
} as const satisfies ListFields;

/**
 * The taxonomies whose labels find a post, in the order the static index has them (its keywords,
 * src/pages/articles/[slug].astro). Not `series`: a static build does not find a post by its series either (the list
 * of its parts is outside the article's searched part).
 */
export const KEYWORD_TAXONOMIES = ["category", "tag"] as const;

/** The plugin's options this theme sets: JSON, checked by `search()` when the site is built. */
export type SearchPluginOptions = {
	collections: string[];
	exclude: string[];
	listPages: { path: string; from: { collection: string; fields: string[] }[]; fallback: { title: string; text?: string } }[];
	taxonomyKeywords: string[];
};

/**
 * The EmDash search plugin's options under `config` (plain JSON, as the plugin asks), so it finds what a static
 * build's search finds:
 *
 * - `collections`: the searched collections. One whose pages are off is left out.
 * - `exclude`: the pages to leave out, an entry whose slug is one of the theme's routes (src/utils/routes.ts): a pages
 *   entry that is no page of its own (`sectionOf`: `search`, `404`, the one that only words /projects, an optional page
 *   that is off) and a post named after one of the list's own routes.
 * - `listPages`: /speaking and /uses, each while it is on, with the words of every talk or item. The page's title and
 *   lead are its pages entry's; with no entry, the theme's words (`fallback`), as `listHead` gives them.
 * - `taxonomyKeywords`: a post's category and tags find it.
 *
 * The plugin reads this when the site is built, so it sees src/theme.config.ts, not a page switch a source sets per
 * request (`Settings.config`, which this theme's EmDash source does not set).
 */
export function searchPluginOptions(config: Pick<Config, "pages">): SearchPluginOptions {
	const names = Object.keys(SEARCH_COLLECTIONS) as SearchCollection[];
	return {
		collections: names.filter((name) => linkOn(SEARCH_ROUTES[name]("*"), config)).map((name) => SEARCH_COLLECTIONS[name]),
		exclude: [...THEME_ROUTES.filter((slug) => !sectionOf(slug, config, THEME_ROUTES)).map(pageHref), ...POST_ROUTES.map(postHref)],
		listPages: HIT_LIST_PAGES.filter((page) => config.pages[page]).map((page) => {
			const { collection, fields } = HIT_LIST_FIELDS[page];
			const { title, lead } = listHead(undefined, strings[page]);
			return { path: OPTIONAL_ROUTES[page], from: [{ collection, fields: [...fields] }], fallback: { title, ...(lead && { text: lead }) } };
		}),
		taxonomyKeywords: [...KEYWORD_TAXONOMIES],
	};
}
