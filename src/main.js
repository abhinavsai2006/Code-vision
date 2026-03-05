/**
 * CodeVision — Main Application
 * Orchestrates the code editor, interpreter, and all visualization components
 */

import './styles/main.css';
import './styles/arrays.css';
import './styles/dialog.css';
import { createEditor, highlightLine, clearHighlight, setLanguage } from './editor.js';
import { Interpreter, StepType } from './interpreter.js';
import { Transpiler } from './transpiler.js';
import { examples } from './examples.js';
import { VariableInspector } from './components/variable-inspector.js';
import { CallStack } from './components/call-stack.js';
import { MemoryView } from './components/memory-view.js';
import { OutputConsole } from './components/output-console.js';
import { ExecutionFlow } from './components/execution-flow.js';
import { Narration } from './components/narration.js';

// ─── State ───────────────────────────────────────────
let editor;
let interpreter = new Interpreter();
let transpiler = new Transpiler();
let executionSteps = [];
let currentStepIndex = -1;
let isRunning = false;
let runInterval = null;
let speed = 5; // 1-10

let currentLang = 'javascript'; // 'javascript', 'java', 'python'

// ─── Components ──────────────────────────────────────
let variableInspector;
let callStack;
let memoryView;
let outputConsole;
let executionFlow;
let narration;

// ─── DOM References ──────────────────────────────────
const btnRun = document.getElementById('btn-run');
const btnStep = document.getElementById('btn-step');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const speedSlider = document.getElementById('speed-slider');
const speedLabel = document.getElementById('speed-label');
const exampleSelector = document.getElementById('example-selector');
const languageSelector = document.getElementById('language-selector');
const lineIndicator = document.getElementById('line-indicator');
const varCount = document.getElementById('var-count');
const btnClearOutput = document.getElementById('btn-clear-output');

// Input Dialog
const inputDialog = document.getElementById('input-dialog');
const inputField = document.getElementById('input-field');
const inputPrompt = document.getElementById('input-prompt');
const btnSubmitInput = document.getElementById('btn-submit-input');

// ─── Initialize ──────────────────────────────────────
function init() {
    // Create editor with first example (JS Variables)
    editor = createEditor('editor-container', examples.javascript.variables);

    // Initialize visualization components
    variableInspector = new VariableInspector('variables-content');
    callStack = new CallStack('stack-content');
    memoryView = new MemoryView('memory-stack-items', 'memory-heap-items');
    outputConsole = new OutputConsole('output-content');
    executionFlow = new ExecutionFlow('flow-content', 'step-counter');
    narration = new Narration('narration-content');

    // Wire up controls
    btnRun.addEventListener('click', handleRun);
    btnStep.addEventListener('click', handleStep);
    btnPause.addEventListener('click', handlePause);
    btnReset.addEventListener('click', handleReset);
    btnClearOutput.addEventListener('click', () => outputConsole.clear());

    speedSlider.addEventListener('input', (e) => {
        speed = parseInt(e.target.value);
        speedLabel.textContent = `${speed}x`;
        // Update interval if running
        if (isRunning && runInterval) {
            clearInterval(runInterval);
            runInterval = setInterval(stepForward, getStepDelay());
        }
    });

    // Language Selector
    languageSelector.addEventListener('change', (e) => {
        const lang = e.target.value;
        currentLang = lang;
        transpiler.setMode(lang);
        setLanguage(editor, lang); // Update Monaco syntax highlighting

        // Reset interpreter state
        handleReset();

        // Load default example for this language
        const defaultExampleKey = 'variables';
        const code = getExampleCode(lang, defaultExampleKey);
        editor.setValue(code);

        // Reset example selector to match
        exampleSelector.value = defaultExampleKey;
    });

    // Example Selector
    exampleSelector.addEventListener('change', (e) => {
        const key = e.target.value;
        const code = getExampleCode(currentLang, key);
        if (code) {
            editor.setValue(code);
            handleReset();
        }
    });

    // Input Dialog Events
    btnSubmitInput.addEventListener('click', handleSubmitInput);
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmitInput();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F10') { e.preventDefault(); handleStep(); }
        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleRun(); }
        if (e.ctrlKey && e.shiftKey && e.key === 'R') { e.preventDefault(); handleReset(); }
        if (e.key === 'Escape') { handlePause(); }
    });

    // Add custom CSS for Monaco line highlighting
    addEditorStyles();
}

function getExampleCode(lang, key) {
    if (examples[lang] && examples[lang][key]) {
        return examples[lang][key];
    }
    return `// No example available for ${key} in ${lang}`;
}

// ─── Editor Highlight Styles ─────────────────────────
function addEditorStyles() {
    const style = document.createElement('style');
    style.textContent = `
    .highlighted-line {
      background: rgba(99, 102, 241, 0.15) !important;
      border-left: 3px solid #6366f1 !important;
      animation: lineHighlight 0.5s ease;
    }
    .highlighted-line-decoration {
      background: #6366f1;
      width: 3px !important;
      margin-left: 3px;
    }
    .highlighted-glyph {
      background: transparent;
    }
    .highlighted-glyph::after {
      content: '▶';
      color: #6366f1;
      font-size: 10px;
      position: absolute;
      left: 4px;
    }
  `;
    document.head.appendChild(style);
}

// ─── Control Handlers ────────────────────────────────
function handleRun() {
    if (isRunning) return;

    // If no steps yet, start execution
    if (executionSteps.length === 0 || currentStepIndex === -1) {
        startExecution();
    }

    isRunning = true;
    updateButtonStates();

    // Auto-step forward
    runInterval = setInterval(() => {
        if (currentStepIndex < executionSteps.length - 1) {
            stepForward();
        } else if (interpreter.isWaitingForInput) {
            // Do nothing, wait for user input (handled by stepForward showing dialog)
            // Check if we are at the last step which is WAITING_INPUT
            const lastStep = executionSteps[executionSteps.length - 1];
            if (lastStep && lastStep.type === StepType.WAITING_INPUT && currentStepIndex === executionSteps.length - 1) {
                // Ensure dialog is shown
                showInputDialog(lastStep.prompt);
                handlePause(); // Pause auto-stepping while waiting
            }
        } else {
            // Check if interpreter finished?
            // If steps stopped coming and no input wait, we are done
            // But how do we know if it's done-done or just computing?
            // For now, if we reach end and no new steps for a cycle...

            // Actually, stepForward handles the end condition (COMPLETE step)
            // If we are here, we might just be waiting for async steps to arrive.
        }
    }, getStepDelay());
}

function handleStep() {
    // If no steps yet, start exec
    if (executionSteps.length === 0 || currentStepIndex === -1) {
        startExecution();
        // Wait a bit for first step?
        setTimeout(stepForward, 50);
        return;
    }

    // If was running, pause first
    if (isRunning) handlePause();

    if (currentStepIndex < executionSteps.length - 1) {
        stepForward();
    }
}

function handlePause() {
    isRunning = false;
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    updateButtonStates();
}

function handleReset() {
    handlePause();
    executionSteps = [];
    currentStepIndex = -1;
    interpreter = new Interpreter(); // Reset interpreter instance

    // Clear all visualizations
    clearHighlight(editor);
    variableInspector.clear();
    callStack.clear();
    memoryView.clear();
    outputConsole.clear();
    executionFlow.clear();
    narration.clear();
    lineIndicator.textContent = 'Line 1';
    varCount.textContent = '0 vars';

    hideInputDialog();

    updateButtonStates();
}

// ─── Execution Logic ─────────────────────────────────
function startExecution() {
    const code = editor.getValue();

    // Transpile if needed
    let executableCode = code;
    try {
        executableCode = transpiler.transpile(code);
    } catch (e) {
        outputConsole.update([`Error transpiling code: ${e.message}`]);
        return;
    }

    // Run asynchronously
    // We don't await this; we let it populate steps
    interpreter.run(executableCode).catch(e => {
        console.error("Interpreter failed:", e);
        // Step forward will catch the ERROR step
    });

    // Link steps reference
    executionSteps = interpreter.steps;
    currentStepIndex = -1;
}

// ─── Step Forward ────────────────────────────────────
function stepForward() {
    if (currentStepIndex >= executionSteps.length - 1) {
        // No more steps available yet
        return;
    }

    currentStepIndex++;
    const step = executionSteps[currentStepIndex];

    // Highlight current line
    if (step.line) {
        highlightLine(editor, step.line);
        lineIndicator.textContent = `Line ${step.line}`;
    }

    // Update visualizations
    variableInspector.update(step.variables, step);
    callStack.update(step.callStack);
    memoryView.update(step.variables, step.heap, step.varName);
    outputConsole.update(step.output);
    executionFlow.update(executionSteps, currentStepIndex);
    executionFlow.setTotalSteps(executionSteps.length); // Update total as we go
    narration.update(step);

    // Update variable count
    const varC = step.variables ? step.variables.length : 0;
    varCount.textContent = `${varC} var${varC !== 1 ? 's' : ''}`;

    // Handle Input Step
    if (step.type === StepType.WAITING_INPUT) {
        handlePause(); // Stop auto-running
        showInputDialog(step.prompt);
        return;
    }

    // Check if execution is complete directly
    if (step.type === StepType.COMPLETE || step.type === StepType.ERROR) {
        handlePause();
        btnRun.classList.remove('running');
    }
}

// ─── Input Handling ──────────────────────────────────
function showInputDialog(promptText) {
    if (promptText) {
        inputPrompt.textContent = promptText;
    } else {
        inputPrompt.textContent = "Please enter a value:";
    }
    inputField.value = '';
    inputDialog.classList.remove('hidden');
    inputField.focus();
}

function hideInputDialog() {
    inputDialog.classList.add('hidden');
}

function handleSubmitInput() {
    const value = inputField.value;
    hideInputDialog();
    interpreter.provideInput(value);

    // Resume execution if we were running, or just update state?
    // The interpreter will now produce more steps.
    // We should probably auto-run if we were running, but handlePause() was called.
    // Let's effectively "Run" again.
    handleRun();
}

// ─── Helpers ─────────────────────────────────────────
function getStepDelay() {
    return Math.max(100, 2200 - speed * 200);
}

function updateButtonStates() {
    btnRun.disabled = isRunning;
    btnStep.disabled = isRunning;
    btnPause.disabled = !isRunning;

    if (isRunning) {
        btnRun.classList.add('running');
    } else {
        btnRun.classList.remove('running');
    }
}

// ─── Boot ────────────────────────────────────────────
init();
