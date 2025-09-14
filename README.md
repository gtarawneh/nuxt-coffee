## nuxt-coffee

Adds CoffeeScript support to Vue SFCs (`<script lang="coffee">`) and `.coffee` files in Nuxt projects using Vite.

### Usage

```
yarn add nuxt-coffee@github:gtarawneh/nuxt-coffee
```

### Limitations and Caveats

- Only works with Nuxt projects using Vite as the builder.
- Supports `<script lang="coffee">` in Vue SFCs and standalone `.coffee` files.
- Does not support `<script setup lang="coffee">`.
- No support for CoffeeScript in `<script>` blocks without the `lang="coffee"` attribute.
- CoffeeScript compilation errors may not always map perfectly to original source lines.
- Hot Module Replacement (HMR) works for Vue files but may have edge cases.
- Vue SFC compiler internals may change — if so, CoffeeScript support could break.
