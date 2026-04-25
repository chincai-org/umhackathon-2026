// @ts-check
import { defineConfig } from "astro/config";
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import bun from "@wyattjoh/astro-bun-adapter";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: bun(),
	vite: {
		build: {
			cssMinify: "lightningcss",
		},
		css: {
			transformer: "lightningcss",
			lightningcss: {
				targets: browserslistToTargets(browserslist("defaults")),
			},
		},
	},
});
