/**
 * CodeVision — Transpiler
 * Syntactical transpilation to run Java and Python code on the JS engine.
 * - Java: Handles classes, types, methods via Regex.
 * - Python: Handles indentation (converted to blocks) and basic syntax.
 */

export class Transpiler {
    constructor() {
        this.mode = 'javascript';
    }

    setMode(mode) {
        this.mode = mode;
    }

    transpile(code) {
        if (this.mode === 'javascript') return code;
        if (this.mode === 'java') return this.transpileJava(code);
        if (this.mode === 'python') return this.transpilePython(code);
        return code;
    }

    // ─── JAVA TRANSPILER ──────────────────────────────────────────────

    transpileJava(code) {
        let js = code;

        // Handle Imports: import java.util.Scanner; -> const Scanner = await __import__("java.util.Scanner");
        // Wildcards are tricky, we'll ignore them or map to a bundle? For now, specific imports only.
        js = js.replace(/import\s+([\w.]+\.(\w+))\s*;/g, 'const $2 = await __import__("$1");');
        js = js.replace(/import\s+([\w.]+)\s*;/g, 'const $1 = await __import__("$1");');

        // 1. Remove Class Wrapper
        // We assume the strict structure "public class Name {"
        js = js.replace(/public\s+class\s+\w+\s*\{/g, '// $&');

        // 2. Remove LAST closing brace "}" (Class end)
        js = js.replace(/\}\s*$/, '// }');

        // 3. Handle Inner Static Classes -> JS Classes
        // "static class Person" -> "class Person"
        js = js.replace(/static\s+class/g, 'class');

        // 4. Handle Constructors
        // Heuristic: Method with Capitalized name and NO return type
        js = js.replace(/(public\s+|private\s+|protected\s+)?([A-Z]\w+)\s*\(([^)]*)\)\s*\{/g, (match, mod, name, args) => {
            // Clean args: "int x, String y" -> "x, y"
            let cleanArgs = args.replace(/\bfinal\s+/g, '');
            cleanArgs = cleanArgs.replace(/[\w<>\[\]]+\s+(\w+)/g, '$1');
            return `constructor(${cleanArgs}) {`;
        });

        // 5. Convert Methods
        const methodRegex = /(public\s+|private\s+|protected\s+)?(static\s+)?([\w<>\[\]]+)\s+((?!if|for|while|switch|catch)\w+)\s*\(([^)]*)\)\s*\{/g;

        js = js.replace(methodRegex, (match, access, staticMod, type, name, params) => {
            // Remove 'final'
            let cleanParams = params.replace(/\bfinal\s+/g, '');
            // Generic Type Removal: "Type Name" -> "Name"
            cleanParams = cleanParams.replace(/[\w<>\[\]]+\s+(\w+)/g, '$1');

            if (staticMod) {
                return `function ${name}(${cleanParams}) {`;
            } else {
                return `${name}(${cleanParams}) {`;
            }
        });

        // 6. Body Logic (Switch, Loops, Vars)
        js = this.transpileJavaBody(js);

        // 7. Java Helpers (Mock Classes)
        // We still provide these globally for convenience, but they can be overridden by imports
        // ERROR prevention: We CANNOT declare "function Scanner" if "const Scanner" is imported at top.
        // So we remove them from here and inject them in the Interpreter globals instead.
        const helpers = `
// Java helpers (only those that cannot be proper classes/imports)
`;

        js += '\n' + helpers;

        // 8. Auto-invoke main
        if (js.includes('function main(')) {
            js += '\n\n// Auto-invoke main\nmain([]);';
        }

        return js;
    }

    transpileJavaBody(js) {
        // Annotations
        js = js.replace(/@Override/g, '');

        // Switch Expressions: case 1 -> ...
        // Handle "case val -> stmt;" -> "case val: stmt; break;"
        // We look for "case" ... "->" ... ";"
        js = js.replace(/case\s+([^:;]+?)\s*->\s*(.+?);/g, 'case $1: $2; break;');
        js = js.replace(/default\s*->\s*(.+?);/g, 'default: $1; break;');

        // Enhanced For Loop: for (Type x : arr) -> for (let x of arr)
        js = js.replace(/for\s*\([\w<>\[\]]+\s+(\w+)\s*:\s*(\w+)\)/g, 'for (let $1 of $2)');

        // Array Initialization: Type[] x = { ... } -> let x = [ ... ]
        // Also just { ... } inside args?
        // We target "= {" -> "= [" and "};" -> "];"
        js = js.replace(/=\s*\{/g, '= [');
        js = js.replace(/\};/g, '];');

        // Arrays arguments: new Person[] { ... } -> [ ... ]
        js = js.replace(/new\s+[\w<>\[\]]+\s*\{/g, '[');
        // clean up closing brace for that might be just "}"
        // Difficult regex.
        // Simplified approach for common cases:

        // Field Declarations vs Local Variables
        // Heuristic: In classes (which use 4-8 spaces indent), Fields look like "Type name;"
        // Local vars (12+ spaces) look like "Type name;"
        // We convert "Type name;" -> "name;" (Field) if indent < 12
        // We convert "Type name;" -> "let name;" (Local) if indent >= 12

        // Fields (Indent 4-10 spaces)
        // Regex handles types with generics <>, arrays [], and trailing comments
        // Capture: $1=indent, $2=name, $3=comment/rest
        // Fields (Indent 2-16 spaces to allow for inner classes)
        // Regex handles types with generics <>, arrays [], and trailing comments
        // Capture: $1=indent, $2=type (ignored), $3=name, $4=comment/rest
        // We match: Indent + Type + Space + Name + semicolon + Rest
        js = js.replace(/^(\s{2,16})([a-zA-Z0-9_<>\[\]]+)\s+(\w+);\s*(.*)$/gm, '$1$3; $4');

        // Locals (Indent 12+ spaces) or lines with assignments
        // Match "Type name =" or "Type name;"
        // Basic Type replacement
        js = js.replace(/\b(int|long|double|float|boolean|char|String|var)(?:\[\])?\s+/g, 'let ');

        // Generic Class Decl: "Random r =" or "ArrayList<String> list =" -> "let r ="
        // Match CapitalizedWord + optional Generics + optional Array + varName + lookahead for [=;:]
        js = js.replace(/\b[A-Z]\w*(?:<[^>]+>)?(?:\[\])*\s+(\w+)\s*(?=[=;:])/g, 'let $1 ');

        // Arrays/List types
        // Removed specific ArrayList replace as the generic one above should catch it now.
        js = js.replace(/=\s*new\s+(ArrayList|LinkedList)(<[^>]*>)?\(\);/g, '= [];');
        js = js.replace(/new\s+int\[(\w+)\]/g, 'new Array($1).fill(0)'); // simple int[]
        // General new Type[size]
        js = js.replace(/new\s+\w+\[(.*?)\]/g, 'new Array($1)');

        // Instantiation: "new Random()" -> "new Random()" (JS classes need new)
        // Keep "new".

        // APIs
        js = js.replace(/System\.out\.println/g, 'console.log');
        js = js.replace(/System\.out\.print/g, 'console.log'); // close enough
        js = js.replace(/Arrays\.toString/g, 'JSON.stringify');
        js = js.replace(/Arrays\.sort\(([^)]+)\)/g, '$1.sort((a,b)=>a-b)');

        js = js.replace(/\.length\(\)/g, '.length');
        js = js.replace(/\.size\(\)/g, '.length');
        js = js.replace(/\.add\(/g, '.push(');
        js = js.replace(/\.get\(/g, '.at(');
        js = js.replace(/\.remove\([^)]*\)/g, '.pop()');

        return js;
    }

    // ─── PYTHON TRANSPILATION ────────────────────────────────────────

    transpilePython(code) {
        const lines = code.split('\n');
        let jsLines = [];
        let indentStack = [0]; // Tack indentation levels

        const getIndent = (line) => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
        };

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Pass through empty lines/comments but preserve for line mapping
            if (line.trim() === '' || line.trim().startsWith('#')) {
                // If comment, JS comment
                if (line.trim().startsWith('#')) {
                    jsLines.push(line.replace(/#/, '//'));
                } else {
                    jsLines.push(line);
                }
                continue;
            }

            const currentIndent = getIndent(line);

            // INDENTATION LOGIC:
            // Decrease: Close blocks for every level we dropped
            while (currentIndent < indentStack[indentStack.length - 1]) {
                indentStack.pop();
                jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
            }

            // Check if we need to open a new block (if indent increased)
            // CRITICAL FIX: Only open a block if the PREVIOUS line started a block (ends with colon)
            // Otherwise, it's just a multi-line statement (like a dictionary), so we ignore the indent increase.

            let prevLine = i > 0 ? lines[i - 1].trim() : '';
            // Skip empty/comment lines when checking previous line
            if (prevLine === '' || prevLine.startsWith('#')) {
                // look further back
                for (let k = i - 1; k >= 0; k--) {
                    if (lines[k].trim() !== '' && !lines[k].trim().startsWith('#')) {
                        prevLine = lines[k].trim();
                        break;
                    }
                }
            }

            if (currentIndent > indentStack[indentStack.length - 1]) {
                if (prevLine.endsWith(':')) {
                    indentStack.push(currentIndent);
                } else {
                    // Indent increased but not a block? 
                    // e.g. multi-line dict. match indent but don't push to stack?
                    // Actually, if we don't push, then when indent decreases, we won't pop. Correct.
                    // But we simply ignore it.
                }
            }

            // Convert Process
            let jsLine = this.convertPythonLine(line.trim());
            jsLines.push(' '.repeat(currentIndent) + jsLine);
        }

        // Close remaining blocks
        while (indentStack.length > 1) {
            indentStack.pop();
            jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
        }

        // Helpers for Python features
        const helpers = `
// Python Helpers
`;
        return jsLines.join('\n') + '\n' + helpers;
    }

    convertPythonLine(line) {
        let js = line;

        // 0. Imports
        if (js.startsWith('import ')) {
            // import math -> const math = await __import__('math');
            // import math as m -> const m = await __import__('math');
            const parts = js.trim().split(/\s+/);
            // parts: ["import", "math"] or ["import", "math", "as", "m"]
            if (parts.length >= 4 && parts[2] === 'as') {
                return `const ${parts[3]} = await __import__('${parts[1]}');`;
            }
            return `const ${parts[1]} = await __import__('${parts[1]}');`;
        }
        if (js.startsWith('from ')) {
            // from math import sqrt -> const { sqrt } = await __import__('math');
            // from math import sqrt as s -> Not supported easily yet
            const match = js.match(/^from\s+(\S+)\s+import\s+(.*)/);
            if (match) {
                // match[2] can be "sqrt, pow"
                return `const { ${match[2]} } = await __import__('${match[1]}');`;
            }
        }

        // 1. Assignments: x = 10 -> let x = 10
        // Heuristic: Start of line is var name, followed by =, not == or +=
        // And not already a keyword
        if (js.match(/^[a-zA-Z_]\w*\s*=\s*[^=]/)) {
            js = 'let ' + js;
        }

        // 2. Syntax Mappings
        js = js.replace(/print\((.*)\)/g, 'console.log($1)');
        js = js.replace(/input\((.*)\)/g, 'await __input__($1)');

        // F-strings: f"Val: {x}" -> `Val: ${x}`
        js = js.replace(/f"(.*?)"/g, (match, content) => {
            return '`' + content.replace(/\{([^}]+)\}/g, '${$1}') + '`';
        });

        // Lists: [1, 2] is valid JS.
        // Access: list[0] is valid JS.

        // List Methods
        js = js.replace(/\.append\(/g, '.push(');
        js = js.replace(/\.insert\(\s*(\w+)\s*,\s*(.*)\s*\)/g, '.splice($1, 0, $2)');
        js = js.replace(/len\(([^)]+)\)/g, '$1.length');

        // Lists slicing [1:3]
        js = js.replace(/\[(\d+):(\d+)\]/g, '.slice($1, $2)');
        js = js.replace(/\[:(\d+)\]/g, '.slice(0, $1)');
        js = js.replace(/\[(\d+):\]/g, '.slice($1)');

        // Logic
        js = js.replace(/\band\b/g, '&&');
        js = js.replace(/\bor\b/g, '||');
        // not keyword logic is hard (not x -> !x). 
        // regex `not ` -> `!`.
        js = js.replace(/\bnot\s+/g, '!');

        // 3. Control Flow & Blocks
        // Conversions to `keyword (...) {`
        // We strip the colon.

        // If/Elif/While: Ensure parens around condition
        const wrapCond = (str) => {
            str = str.replace(/:$/, '').trim(); // remove colon
            if (!str.startsWith('(')) return `(${str})`;
            return str;
        };

        if (js.match(/^if\s+/)) {
            js = `if ${wrapCond(js.substring(3))} {`;
        }
        else if (js.match(/^elif\s+/)) {
            js = `else if ${wrapCond(js.substring(5))} {`;
        }
        else if (js.match(/^while\s+/)) {
            js = `while ${wrapCond(js.substring(6))} {`;
        }
        else if (js.match(/^else:/)) {
            js = 'else {';
        }
        else if (js.match(/^for\s+/)) {
            // for x in y:
            // remove colon
            let content = js.replace(/:$/, '');
            const match = content.match(/^for\s+(\w+)\s+in\s+(.*)/);
            if (match) {
                // match[1] = var, match[2] = iterable
                js = `for (let ${match[1]} of ${match[2]}) {`;
            }
        }
        else if (js.match(/^def\s+/)) {
            // def foo(args):
            let content = js.replace(/:$/, '');
            const match = content.match(/^def\s+(\w+)\((.*)\)/);
            if (match) {
                js = `function ${match[1]}(${match[2]}) {`;
            }
        }

        // Constants
        js = js.replace(/\bTrue\b/g, 'true');
        js = js.replace(/\bFalse\b/g, 'false');
        js = js.replace(/\bNone\b/g, 'null');

        return js;
    }
}
