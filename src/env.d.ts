/// <reference types="@astronomic/content/virtual" />
/// <reference types="@astronomic-dev/ui/system/virtual" />
/// <reference types="@astronomic-dev/search/astro/virtual" />

// The search parts for the chosen source (src/search/setup.mjs points these at src/search/<mode>/). Every mode's part
// takes the same props (src/search/types.ts), so the types are the same whichever one is built.
declare module "astronomic:search/Trigger.astro" {
	const Trigger: (props: import("./search/types").TriggerProps) => unknown;
	export default Trigger;
}
declare module "astronomic:search/Field.astro" {
	const Field: (props: import("./search/types").FieldProps) => unknown;
	export default Field;
}
declare module "astronomic:search/Results.astro" {
	const Results: (props: import("./search/types").ResultsProps) => unknown;
	export default Results;
}
