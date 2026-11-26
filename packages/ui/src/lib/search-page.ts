/**
 * SearchPage's pure helpers. The URL (`?q=dark+mode&type=docs&theme=vega`), the Back and Forward toggles, the first
 * pages of a result for "Show more results" and the page's words come from the search package
 * (`@astronomic-dev/search/page`), so the kit and the embed's results page share one copy. The kit passes no URL
 * names, so its URLs keep the defaults and `index` is always null. The page's eager script shares this file, so the
 * package's page helpers import only types; the browser glue is lib/search-page-app.ts, loaded on first use.
 */
export {
	PAGE_SIZE,
	defaultPageWords,
	pageStrings,
	pickToggles,
	readUrl,
	slicePages,
	writeUrl,
	type PageWords,
	type Picks,
	type SearchPageStrings,
	type Slice,
	type UrlState,
} from "@astronomic-dev/search/page";

/** The page part's root, a <search> element. */
export const PAGE = "[data-search-page]";
