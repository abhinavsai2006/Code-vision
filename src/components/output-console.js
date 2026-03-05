/**
 * CodeVision — Output Console Component
 * Displays console.log output with animations
 */

export class OutputConsole {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.lines = [];
    }

    update(output) {
        if (!output || output.length === 0) {
            this.container.innerHTML = '<div class="console-placeholder">Console output will appear here</div>';
            this.lines = [];
            return;
        }

        // Only add new lines
        if (output.length > this.lines.length) {
            const newLines = output.slice(this.lines.length);

            // Remove placeholder if first output
            if (this.lines.length === 0) {
                this.container.innerHTML = '';
            }

            for (const line of newLines) {
                const div = document.createElement('div');
                div.className = 'console-line log';
                div.innerHTML = `<span class="console-prefix">›</span>${this.escapeHtml(line)}`;
                this.container.appendChild(div);

                // Auto-scroll to bottom
                this.container.scrollTop = this.container.scrollHeight;
            }

            this.lines = [...output];
        }
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    addError(message) {
        const div = document.createElement('div');
        div.className = 'console-line error';
        div.innerHTML = `<span class="console-prefix">✕</span>${this.escapeHtml(message)}`;
        this.container.appendChild(div);
        this.container.scrollTop = this.container.scrollHeight;
    }

    clear() {
        this.container.innerHTML = '<div class="console-placeholder">Console output will appear here</div>';
        this.lines = [];
    }
}
