## How the Plugin Works

The plugin consists of three files: `index.js` (the Nuxt module entry), `patching.js` (a compiler patch), and `plugin.js` (the Vite plugin itself).

### index.js

The entry point does two things when Nuxt initialises:

1. Calls `patchCompiler()` to patch the Vue SFC compiler (see below)
2. Registers the Vite plugin

### patching.js: silencing the compiler

The Vue SFC compiler does not know CoffeeScript. If it encounters `<script lang="coffee">` it will try to parse the CoffeeScript source as JavaScript and throw an error.

`patching.js` wraps `compileScript` with a patched version that checks the script block's `lang` attribute. If it is `"coffee"`, it returns `null` instead of calling the real compiler. This silences the error.

This patch is necessary, but it has a side effect that matters for HMR, explained below.

### plugin.js: the Vite plugin

The plugin is registered with `enforce: "pre"`, meaning it runs before plugin-vue in every hook.

#### load — compiling CoffeeScript on disk load

When the browser first requests a `.vue` file, the `load` hook intercepts it. If the file contains `<script lang="coffee">`, the hook reads the file, compiles the CoffeeScript block to JavaScript via `transformCoffeescript`, and returns the result — a standard `.vue` file with a plain `<script>` block. Plugin-vue never sees `lang="coffee"`; it sees compiled JavaScript.

For standalone `.coffee` files, the `transform` hook does the same thing: compile and return JavaScript.

#### The HMR problem

When a `.vue` file is saved, plugin-vue's `handleHotUpdate` runs. Its first step is to call `ctx.read()` to get the updated file content. By default, `ctx.read()` returns the raw file content from disk — which still contains `<script lang="coffee">`.

Plugin-vue then calls `compileScript` to fingerprint the script block and compare it against its cached version. But `compileScript` has been patched to return `null` for CoffeeScript. With no fingerprint to compare, plugin-vue cannot detect whether the script changed and does nothing.

#### handleHotUpdate — the fix

Our plugin's `handleHotUpdate` runs before plugin-vue. For `.vue` files containing CoffeeScript, it replaces `ctx.read` with a function that returns the already-compiled content (CoffeeScript replaced with JavaScript) instead of the raw file:

```js
ctx.read = () => transformCoffeescript(content, file);
```

Then it returns `undefined`, handing control to plugin-vue.

When plugin-vue runs, it calls `ctx.read()` and receives compiled JavaScript. It can now fingerprint and diff the script block normally, against the compiled JavaScript it cached the first time the file was loaded. From plugin-vue's point of view this is an ordinary JavaScript component, and it applies exactly the right HMR: component re-mount for script changes, template patch for template changes, style swap for style changes — with no full page reloads.
