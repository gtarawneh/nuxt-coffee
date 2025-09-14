const sfc = require("@vue/compiler-sfc");

const _compileScript = sfc.compileScript;

function compileScriptPatched(sfc, options) {
    const isCoffee = sfc.script?.lang === "coffee";

    if (isCoffee) {
        return null;
    }

    return _compileScript(sfc, options);
}

export function patchCompiler() {
    if (!sfc.compileScript || typeof sfc.compileScript !== "function") {
        console.warn("Vue SFC compiler structure has changed, CoffeeScript support may not work");
        return;
    }
    sfc.compileScript = compileScriptPatched;
}
