/**
 * The props of the search parts pages import as `astronomic:search/*` (src/search/setup.mjs picks the mode's folder).
 * Every mode has the same three parts with the same props:
 *
 *   Trigger.astro  A link to the search page, its label in the slot. Where the build has a search dialog it opens it,
 *                  and it must be on every page: it also loads the dialog's script (the footer's link is one).
 *   Field.astro    The search form above a list (/articles). With no JavaScript it posts to the search page.
 *   Results.astro  The search page's body: its <h1>, the form and the results. Request and EmDash builds get the
 *                  query and its hits from the page; a static build has none and reads `?q=` in the browser.
 */
import type { SearchHit } from "@astronomic/content";
import type { strings } from "../theme.strings";

/** The words of a search form. */
export type SearchFormStrings = (typeof strings)["search"]["form"];

export interface TriggerProps {
	/** The search page. */
	href: string;
	/** The search page is the current page. */
	current?: boolean;
	/** Where focus goes when a dialog opened by the shortcut closes (static builds): the one trigger that always shows. */
	main?: boolean;
	class?: string;
	/** The accessible name of a trigger with no text (the nav's icon). */
	"aria-label"?: string;
	/** Which of the nav's two it is (SiteNav.astro): the bar's icon or the phone menu's button. */
	"data-nav-search"?: "icon" | "label";
	/** The label (the slot). */
	children?: unknown;
}

export interface FieldProps {
	/** The search page. */
	action: string;
	strings: SearchFormStrings;
}

export interface ResultsProps {
	/** The request's query ("" in a static build). */
	query: string;
	/** The hits to show, at most the page's limit ([] in a static build). */
	hits: SearchHit[];
	/** More matched than `hits` holds. */
	more: boolean;
	/** The site's title, for the browser's title. */
	siteTitle: string;
}
