## nuxt-coffee

Adds CoffeeScript support to Vue SFCs (`<script lang="coffee">`) and `.coffee` files in Nuxt projects using Vite.

This is a simple loader for anyone who wants to enjoy the ergonomics of CoffeeScript in Nuxt, even if it comes with a few rough edges. It works for most cases, with a few (reasonable?) limitations; see below for details.

### Usage

First, install the package:

```
yarn add --dev nuxt-coffee@github:gtarawneh/nuxt-coffee
```

Then, add the module to your Nuxt config:

```js
export default defineNuxtConfig({
    modules: [
        "nuxt-coffee",
    ],
})
```

### Support and Limitations

- Only works with Nuxt projects using Vite as the builder.
- Supports `<script lang="coffee">` in Vue SFCs and standalone `.coffee` files.
- Does not support `<script setup lang="coffee">`.
- No support for CoffeeScript in `<script>` blocks without the `lang="coffee"` attribute.
