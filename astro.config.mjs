// @ts-check

import bun from "@wyattjoh/astro-bun-adapter";
import { defineConfig } from "astro/config";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";

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
