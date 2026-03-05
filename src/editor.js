/**
 * CodeVision — Editor Setup
 * Initializes Monaco Editor with JavaScript support and dark theme
 */

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// Import language features 
import 'monaco-editor/esm/vs/basic-languages/java/java.contribution';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution';

// Configure Monaco workers
self.MonacoEnvironment = {
    getWorker(_, label) {
        try {
            if (label === 'json') {
                return new jsonWorker();
            }
            if (label === 'css' || label === 'scss' || label === 'less') {
                return new cssWorker();
            }
            if (label === 'html' || label === 'handlebars' || label === 'razor') {
                return new htmlWorker();
            }
            if (label === 'typescript' || label === 'javascript') {
                return new tsWorker();
            }
            return new editorWorker();
        } catch (e) {
            console.error("Worker Load Error:", e);
            return new editorWorker(); // Fallback
        }
    }
};

// Define custom dark theme
monaco.editor.defineTheme('codevision-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: '', foreground: 'f1f5f9', background: '0f1629' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c084fc' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: '60a5fa' },
        { token: 'type', foreground: 'fbbf24' },
        { token: 'identifier', foreground: 'e2e8f0' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'variable', foreground: 'f1f5f9' },
        { token: 'variable.predefined', foreground: '818cf8' },
    ],
    colors: {
        'editor.background': '#0f1629',
        'editor.foreground': '#f1f5f9',
        'editor.lineHighlightBackground': '#1e293b',
        'editor.selectionBackground': '#334155',
        'editorCursor.foreground': '#6366f1',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#6366f1',
        'editorGutter.background': '#0c1220',
        'editor.rangeHighlightBackground': '#6366f11a',
    },
});

export function createEditor(containerId, initialCode) {
    const editor = monaco.editor.create(document.getElementById(containerId), {
        value: initialCode,
        language: 'javascript',
        theme: 'codevision-dark',
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        roundedSelection: true,
        padding: { top: 12, bottom: 12 },
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        renderLineHighlight: 'all',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        glyphMargin: true,
        folding: true,
        lineDecorationsWidth: 8,
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
        },
    });

    return editor;
}

// Highlight a specific line in the editor
let currentDecorations = [];

export function highlightLine(editor, lineNumber) {
    if (!lineNumber) {
        currentDecorations = editor.deltaDecorations(currentDecorations, []);
        return;
    }

    currentDecorations = editor.deltaDecorations(currentDecorations, [
        {
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'highlighted-line',
                glyphMarginClassName: 'highlighted-glyph',
                linesDecorationsClassName: 'highlighted-line-decoration',
            },
        },
    ]);

    // Scroll line into view
    editor.revealLineInCenter(lineNumber);
}

export function clearHighlight(editor) {
    currentDecorations = editor.deltaDecorations(currentDecorations, []);
}

export function setLanguage(editor, languageId) {
    const model = editor.getModel();
    if (model) {
        monaco.editor.setModelLanguage(model, languageId);
    }
}
