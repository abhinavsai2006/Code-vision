/**
 * CodeVision — Narration Component
 * Plain-English descriptions of what the code is doing
 */

export class Narration {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    update(step) {
        // Show only the current step narration (most recent)
        const isComplete = step.type === 'complete';
        const isError = step.type === 'error';

        let classes = 'narration-step active';
        if (isComplete) classes = 'execution-complete';
        if (isError) classes = 'execution-error';

        this.container.innerHTML = `
      <div class="${classes}">
        <span class="narration-icon">${step.icon || '•'}</span>
        <span class="narration-text">${step.description}</span>
      </div>
    `;
    }

    clear() {
        this.container.innerHTML = '<div class="narration-placeholder">Press <kbd>Step</kbd> or <kbd>Run</kbd> to start execution</div>';
    }
}
