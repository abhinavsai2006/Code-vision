/**
 * CodeVision — Execution Flow / Timeline Component
 * Step-by-step timeline view of execution
 */

export class ExecutionFlow {
    constructor(containerId, stepCounterId) {
        this.container = document.getElementById(containerId);
        this.stepCounter = document.getElementById(stepCounterId);
        this.currentStep = 0;
        this.totalSteps = 0;
    }

    setTotalSteps(total) {
        this.totalSteps = total;
    }

    update(steps, currentIndex) {
        this.currentStep = currentIndex;
        this.stepCounter.textContent = `Step ${currentIndex + 1} / ${this.totalSteps}`;

        // Show a window of steps around the current one
        const windowSize = 12;
        const startIdx = Math.max(0, currentIndex - 3);
        const endIdx = Math.min(steps.length, startIdx + windowSize);
        const visibleSteps = steps.slice(startIdx, endIdx);

        const html = visibleSteps.map((step, i) => {
            const actualIdx = startIdx + i;
            const isActive = actualIdx === currentIndex;
            const isPast = actualIdx < currentIndex;

            return `
        <div class="flow-step ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}">
          <span class="flow-step-num">${actualIdx + 1}</span>
          <span class="flow-step-line">${step.line ? `L${step.line}` : '—'}</span>
          <span class="flow-step-desc">${step.icon || '•'} ${this.stripHtml(step.description).slice(0, 60)}</span>
        </div>
      `;
        }).join('');

        this.container.innerHTML = html;

        // Scroll active into view
        const activeEl = this.container.querySelector('.flow-step.active');
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    clear() {
        this.container.innerHTML = '<div class="flow-placeholder">Execution steps will appear here</div>';
        this.stepCounter.textContent = 'Step 0';
        this.currentStep = 0;
    }
}
