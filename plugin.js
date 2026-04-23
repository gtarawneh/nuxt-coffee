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

function generateFrame(code, line, column) {
    const lines = code.split('\n');
    const start = Math.max(0, line - 4);
    const end = Math.min(lines.length, line + 5);
    const width = String(end).length;
    const result = [];

    for (let i = start; i < end; i++) {
        const marker = i === line ? '>' : ' ';
        result.push(`${marker} ${String(i + 1).padStart(width)} | ${lines[i]}`);
        if (i === line) {
            result.push(`  ${' '.repeat(width)} | ${' '.repeat(column)}^`);
        }
    }

    return "Lines:\n\n" + result.join('\n');
}

function createCompileException(originalException, startLineNumber, fileCode) {
    const { location } = originalException;

    if (location) {
        location.first_line = location.first_line + startLineNumber + 1;
        location.last_line = location.last_line + startLineNumber;
    }
    originalException.code = fileCode;

    const exception = new Error(originalException.message);
    exception.stack = null;

    if (location) {
        exception.loc = { line: location.first_line + 1, column: location.first_column };
        exception.frame = generateFrame(fileCode, location.first_line, location.first_column);
    }

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
            this.error({
                message: error.message,
                loc: error.loc ? { file: id, ...error.loc } : undefined,
                frame: error.frame
            });
        }
    }

    return null;
}

function createCompilationError(error, id, code) {
    const detailed = new Error(error.message);

    if (error.location) {
        const line = error.location.first_line + 1;
        const column = error.location.first_column;
        detailed.loc = { file: id, line, column };
        detailed.frame = generateFrame(code, error.location.first_line, error.location.first_column);
    } else {
        detailed.loc = undefined;
    }

    return detailed;
}

function transform(code, id) {
    if (isCoffeeFile(id)) {
        try {
            return { code: compile(code, id) };
        } catch (error) {
            throw createCompilationError(error, id, code);
        }
    }

    return null;
}

function handleHotUpdate(ctx) {
    const { file } = ctx;

    if (!isVueFile(file))
        return;

    const content = readFile(file);

    if (!content.includes('<script lang="coffee">'))
        return;

    ctx.read = () => transformCoffeescript(content, file);
}

export default {
    name: "Coffeescript Module",
    load,
    transform,
    handleHotUpdate,
    enforce: "pre"
};
