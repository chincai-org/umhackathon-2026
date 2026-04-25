// @ts-check
import { defineConfig } from "astro/config";
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
	output: "server", // or 'hybrid'
	adapter: node({ mode: "standalone" }),
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
