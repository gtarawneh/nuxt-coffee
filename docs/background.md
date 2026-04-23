## Background: Vite's Hot Module Reloading

When you save a file during development, Vite detects the change via a filesystem watcher. Rather than refreshing the entire browser page, it tries to surgically update only what changed. This is HMR.

### The module graph

Vite maintains an internal map of every module the browser has loaded and how they relate to each other (what imports what). This is the module graph. When a file changes, Vite consults the graph to know which modules are affected.

### The plugin pipeline

Vite is built around a plugin system. When a module is first requested by the browser, plugins process it in order via two hooks:

- **`load`** — a plugin can intercept a file path and return custom content, replacing what would otherwise be read from disk.
- **`transform`** — a plugin can take the content of a module and transform it before it reaches the browser.

Plugins can declare `enforce: "pre"` to run before all other plugins, or `enforce: "post"` to run after. Unmarked plugins run in the middle.

### What happens on save: handleHotUpdate

When a watched file changes, Vite calls `handleHotUpdate(ctx)` on each plugin in order. The `ctx` object contains:

- `ctx.file` — the path of the changed file
- `ctx.modules` — the module graph entries for this file
- `ctx.read()` — an async function that returns the new file content
- `ctx.server` — the Vite dev server

A plugin's `handleHotUpdate` can return:

- **`undefined`** — "I'm not handling this." Vite moves on to the next plugin.
- **an array of modules** — "Update exactly these modules." Vite invalidates them and notifies the browser.
- **`[]`** (empty array) — "I've fully handled this, do nothing else."

The first plugin to return a non-`undefined` value wins — subsequent plugins' `handleHotUpdate` hooks do not run.

### plugin-vue and Vue SFCs

`plugin-vue` (the official Vite plugin for `.vue` files) is where Vue-specific HMR intelligence lives. When it handles a `.vue` file change, it:

1. Reads the new file content via `ctx.read()`
2. Parses the SFC into its blocks (template, script, style)
3. Compares each block against its internally cached version from the last compile
4. Applies the most targeted update it can:
   - **Template changed** → patches just the render function, no component re-mount
   - **Style changed** → swaps the stylesheet, no component re-mount
   - **Script changed** → re-mounts the component (resets its local state), but the rest of the page is untouched
   - **Nothing changed** → does nothing

This is why editing a button's script only re-mounts the button, not the whole page.

### The compiler: @vue/compiler-sfc

Underneath plugin-vue sits `@vue/compiler-sfc`, the Vue SFC compiler. Among other things it provides `compileScript`, which parses a script block into an AST and produces JavaScript. Plugin-vue uses this both when building modules for the browser and when diffing blocks during HMR.
