/** What search covers (src/content/search-scope.ts), and the parts of a build with no search plugin (src/search/). */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { search } from "@astronomic-dev/search/emdash";
import { HIT_LIST_FIELDS, HIT_LIST_PAGES, searchPluginOptions } from "../../src/content/search-scope.ts";
import { listPageHits, ownListHit } from "../../src/content/search.ts";
import { strings } from "../../src/theme.strings.ts";
import { getConfig, OPTIONAL_PAGES } from "../../src/utils/config.ts";
import { isReservedPostSlug, isReservedSlug, THEME_ROUTES } from "../../src/utils/routes.ts";
import { LIST_PAGES, sectionOf } from "../../src/utils/sections.ts";

/** Every module a file names after `from`, `import` or `import(`. */
const specifiers = (text) => [...text.matchAll(/\b(?:from|import)\s*\(?\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);

const pages = (off = []) => ({ pages: Object.fromEntries(OPTIONAL_PAGES.map((p) => [p, !off.includes(p)])) });

/** The excluded optional pages. */
const offIn = ({ exclude }) => OPTIONAL_PAGES.map((p) => `/${p}`).filter((path) => exclude.includes(path));

test("the search plugin's options: every page on", () => {
	assert.deepEqual(searchPluginOptions(pages()).collections, ["posts", "projects", "pages"]);
	assert.deepEqual(offIn(searchPluginOptions(pages())), ["/projects"]);
	assert.deepEqual(searchPluginOptions(getConfig().config), searchPluginOptions(pages()), "the config file as it ships");
});

test("the search plugin's options: a page that is off goes, with its collection", () => {
	assert.deepEqual(searchPluginOptions(pages(["projects"])).collections, ["posts", "pages"]);
	assert.deepEqual(offIn(searchPluginOptions(pages(["projects"]))), ["/projects"]);
	assert.deepEqual(searchPluginOptions(pages(["speaking", "uses", "now"])).collections, ["posts", "projects", "pages"]);
	assert.deepEqual(offIn(searchPluginOptions(pages(["speaking", "uses", "now"]))).sort(), ["/now", "/projects", "/speaking", "/uses"]);
	const all = searchPluginOptions(pages([...OPTIONAL_PAGES]));
	assert.deepEqual(all, JSON.parse(JSON.stringify(all)), "plain JSON");
	for (const page of OPTIONAL_PAGES) assert.ok(all.exclude.includes(`/${page}`), page);
});

test("an entry whose slug is one of the theme's routes is excluded, unless the route shows it", () => {
	for (const config of [pages(), pages(["speaking"]), pages([...OPTIONAL_PAGES])]) {
		const { exclude } = searchPluginOptions(config);
		for (const slug of [...THEME_ROUTES, "about", "privacy"]) {
			assert.equal(exclude.includes(`/${slug}`), !sectionOf(slug, config, [slug]), slug);
		}
		for (const path of ["/search", "/404", "/articles", "/articles/page", "/articles/category"]) assert.ok(exclude.includes(path), path);
		for (const path of exclude) assert.ok(isReservedSlug(path.slice(1)) || isReservedPostSlug(path.replace("/articles/", "")), path);
	}
});

test("every list page's own entry is excluded or is the page's one hit", () => {
	const { exclude } = searchPluginOptions(pages());
	for (const page of LIST_PAGES) {
		assert.ok(ownListHit({ collection: "pages", slug: page }));
		assert.equal(exclude.includes(`/${page}`), page === "projects", page);
	}
});

test("the list pages: each one that is on, with its items' words and the theme's own title and lead", () => {
	assert.deepEqual(searchPluginOptions(pages()).listPages, [
		{
			path: "/speaking",
			from: [{ collection: "talks", fields: ["title", "event", "place", "summary"] }],
			fallback: { title: strings.speaking.title, text: strings.speaking.lead },
		},
		{ path: "/uses", from: [{ collection: "uses", fields: ["group", "name", "note"] }], fallback: { title: strings.uses.title, text: strings.uses.lead } },
	]);
	const paths = (off) => searchPluginOptions(pages(off)).listPages.map((p) => p.path);
	assert.deepEqual(paths(["speaking"]), ["/uses"]);
	assert.deepEqual(paths(["uses"]), ["/speaking"]);
	assert.deepEqual(paths([...OPTIONAL_PAGES]), []);
	for (const off of [[], ["speaking"], [...OPTIONAL_PAGES]]) {
		const { exclude, listPages } = searchPluginOptions(pages(off));
		for (const { path } of listPages) assert.ok(!exclude.includes(path), `${path} is excluded too`);
	}
});

test("the list pages' fields are the demo's EmDash fields, and the ones the server's list matches", () => {
	const seed = JSON.parse(readFileSync(new URL("../../seed/seed.json", import.meta.url), "utf8"));
	for (const page of HIT_LIST_PAGES) {
		const { collection, fields } = HIT_LIST_FIELDS[page];
		const slugs = seed.collections.find((c) => c.slug === collection).fields.map((f) => f.slug);
		for (const field of fields) {
			assert.ok(slugs.includes(field), `${collection}.${field}`);
			const lists = { talks: [], uses: [], [collection]: [{ [field]: "Quillwort" }] };
			assert.deepEqual(listPageHits("quillwort", lists).map((h) => h.slug), [page], `${collection}.${field}`);
		}
	}
});

test("a post's category and tags are its keywords in both builds, its series in neither", () => {
	const { taxonomyKeywords } = searchPluginOptions(pages());
	assert.deepEqual(taxonomyKeywords, ["category", "tag"]);
	const page = readFileSync(new URL("../../src/pages/articles/[slug].astro", import.meta.url), "utf8");
	assert.match(page, /keywords=\{\[post\.category, \.\.\.post\.tags\]/);
});

test("the search plugin takes the options, whatever is on", () => {
	for (const off of [[], ["speaking"], ["projects", "uses"], [...OPTIONAL_PAGES]]) {
		const options = searchPluginOptions(pages(off));
		assert.deepEqual(search(options).options, options);
	}
});

/** Every file a part imports by a relative path or from the theme's own search folder, the part included. */
function closure(file, seen = new Map()) {
	if (seen.has(file)) return seen;
	const specs = specifiers(readFileSync(file, "utf8"));
	seen.set(file, specs);
	for (const spec of specs) if (/^\.{1,2}\/.*\.astro$/.test(spec)) closure(resolve(dirname(file), spec), seen);
	return seen;
}

test("a server source with no search plugin: no part imports the search package or an EmDash part", () => {
	const dir = fileURLToPath(new URL("../../src/search/request/", import.meta.url));
	const parts = readdirSync(dir).filter((f) => f.endsWith(".astro"));
	assert.ok(["Trigger.astro", "Field.astro", "Results.astro"].every((p) => parts.includes(p)));
	for (const part of parts) {
		for (const [file, specs] of closure(join(dir, part))) {
			assert.ok(file.startsWith(dir), `${part} imports ${file}`);
			for (const spec of specs) assert.doesNotMatch(spec, /@astronomic-dev\/search|astronomic-search|emdash/, `${file}: ${spec}`);
			assert.doesNotMatch(readFileSync(file, "utf8"), /data-search-placement|data-search-results/, file);
		}
	}
	// The setup file: the plugin is named only for a static build and for EmDash.
	const setup = specifiers(readFileSync(new URL("../../src/search/setup.mjs", import.meta.url), "utf8"));
	assert.deepEqual(setup.filter((s) => !s.startsWith("node:")), ["./static/integration.mjs"]);
});

test("the mode per kind of source", async () => {
	const { searchSetup } = await import("../../src/search/setup.mjs");
	for (const [content, mode] of [
		[{ name: "emdash", output: "server" }, "emdash"],
		[{ name: "wordpress", output: "server" }, "request"],
	]) {
		const got = await searchSetup(content);
		assert.equal(got.mode, mode);
		assert.deepEqual(got.integrations, []);
		assert.match(got.alias["astronomic:search"], new RegExp(`/src/search/${mode}$`));
	}
});
