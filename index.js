import { patchCompiler } from "./patching.js";
import CoffeescriptPlugin from "./plugin.js";

function addPlugin(nuxt, plugin) {
    nuxt.options.vite.plugins = nuxt.options.vite.plugins || [];
    nuxt.options.vite.plugins.push(plugin);
}

export default function (inlineOptions, nuxt) {
    patchCompiler();
    addPlugin(nuxt, CoffeescriptPlugin);
}
