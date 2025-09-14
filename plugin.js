const coffeescript = require("coffeescript");
import fs from "fs";

export function readFile(filePath) {
    return fs.readFileSync(filePath, "utf8");
}

function isCoffeeFile(id) {
    return id.endsWith(".coffee");
}

function isVueFile(id) {
    return id.endsWith(".vue");
}

function createCompileException(originalException, startLineNumber, fileCode) {
    const { location } = originalException;

    if (location) {
        location.first_line = location.first_line + startLineNumber;
        location.last_line = location.last_line + startLineNumber;
    }
    originalException.code = fileCode;

    const exception = new Error(String(originalException));
    exception.stack = null;
    return exception;
}

export function compile(code, filename, startLineNumber = 0, fileCode = null) {
    try {
        return coffeescript.compile(code, { bare: true, filename });
    } catch (exception) {
        if (startLineNumber > 0 && fileCode) {
            throw createCompileException(exception, startLineNumber, fileCode);
        }
        throw exception;
    }
}

function transformCoffeescript(code, filename) {

    if (!code.includes('<script lang="coffee">')) {
        return code; // Skip regex entirely if no CoffeeScript
    }

    const coffeeReg = /<script lang="coffee">\s*\n([\s\S]*?)\n\s*<\/script>/g;

    return code.replace(coffeeReg, (match, coffeeCode) => {
        const startLineNumber = (code.substring(0, code.indexOf(match)).match(/\n/g) || []).length + 1;

        try {
            const compiled = compile(coffeeCode, filename, startLineNumber, code);
            return `<script>\n${compiled}\n</script>`;
        } catch (error) {
            console.error(`CoffeeScript compilation error in ${filename}:`, error.message);
            throw error;
        }
    });
}

function load(id) {
    if (isVueFile(id)) {
        try {
            const content = readFile(id);

            if (content.includes('<script lang="coffee">')) {
                return transformCoffeescript(content, id);
            }
        } catch (error) {
            this.error(`Failed to process Vue file ${id}: ${error.message}`);
        }
    }

    return null;
}

function transform(code, id) {
    if (isCoffeeFile(id)) {
        try {
            return { code: compile(code, id) };
        } catch (error) {
            this.error(`Failed to compile CoffeeScript file ${id}: ${error.message}`);
        }
    }

    return null;
}

function handleHotUpdate(ctx) {
    const { file, server } = ctx;

    if (isVueFile(file)) {
        try {
            const content = readFile(file);

            if (content.includes('<script lang="coffee">')) {
                const module = server.moduleGraph.getModuleById(file);
                if (module) {
                    server.reloadModule(module);
                }

                // Return the original modules to let Vite handle other transformations
                return ctx.modules;
            }
        } catch (error) {
            console.error(`HMR error for ${file}:`, error.message);
        }
    }

    // Let other plugins handle their HMR
    return ctx.modules;
}

export default {
    name: "Coffeescript Module",
    load,
    transform,
    handleHotUpdate,
    enforce: "pre"
};
