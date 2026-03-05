/**
 * CodeVision — Call Stack Component
 * Visual stack representation with animated push/pop
 */

export class CallStack {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.previousStack = [];
    }

    update(callStack) {
        if (!callStack || callStack.length === 0) {
            this.container.innerHTML = '<div class="stack-placeholder">Stack is empty</div>';
            this.previousStack = [];
            return;
        }

        const icons = ['🌐', '⚡', '🔷', '🔶', '◆'];

        const html = callStack.map((frame, index) => {
            const depth = Math.min(index, 4);
            const isActive = index === callStack.length - 1;
            const isNew = index >= this.previousStack.length;

            return `
        <div class="stack-frame depth-${depth} ${isActive ? 'active' : ''} ${isNew ? '' : ''}" 
             style="${isActive ? 'animation: stackPush 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);' : ''}">
          <span class="stack-fn-icon">${icons[depth] || '◆'}</span>
          <span class="stack-fn-name">${frame.name}()</span>
          <span class="stack-fn-line">line ${frame.line}</span>
        </div>
      `;
        }).join('');

        this.container.innerHTML = html;
        this.previousStack = [...callStack];
    }

    clear() {
        this.container.innerHTML = '<div class="stack-placeholder">Stack is empty</div>';
        this.previousStack = [];
    }
}
