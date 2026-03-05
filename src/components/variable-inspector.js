/**
 * CodeVision — Variable Inspector Component
 * Renders animated variable cards and enhanced array visualizations
 */

export class VariableInspector {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.previousVars = new Map();
    }

    update(variables, debugStep) {
        if (!variables || variables.length === 0) {
            this.container.innerHTML = '<div class="var-placeholder">No variables declared yet</div>';
            this.previousVars.clear();
            return;
        }

        const html = variables.map(v => {
            const isNew = !this.previousVars.has(v.name);

            // Check if value changed
            const currentValStr = typeof v.value === 'string' ? v.value : JSON.stringify(v.value);
            const prevValStr = this.previousVars.get(v.name);
            const isUpdated = this.previousVars.has(v.name) && prevValStr !== currentValStr;

            const classes = ['var-card'];
            if (isNew) classes.push('new-var');
            if (isUpdated) classes.push('updated');
            if (v.type === 'array') classes.push('var-card-array');

            const typeColor = this.getTypeColor(v.type);

            // Special rendering for arrays
            let valueHtml = '';
            if (v.type === 'array') {
                valueHtml = this.renderArray(v, debugStep);
            } else {
                valueHtml = `<div class="var-value" style="color: ${typeColor}">${this.escapeHtml(v.value)}</div>`;
            }

            return `
        <div class="${classes.join(' ')}" style="border-color: ${isNew || isUpdated ? typeColor : ''}; ${isNew || isUpdated ? `box-shadow: 0 0 12px ${typeColor}33;` : ''}">
          <div class="var-card-header">
            <span class="var-name">${v.name}</span>
            <span class="var-type-badge var-type-${v.type}">${v.type}</span>
          </div>
          ${valueHtml}
          <div class="var-scope">${v.scope}</div>
        </div>
      `;
        }).join('');

        this.container.innerHTML = html;

        // Update tracking
        this.previousVars.clear();
        variables.forEach(v => {
            const valStr = typeof v.value === 'string' ? v.value : JSON.stringify(v.value);
            this.previousVars.set(v.name, valStr);
        });
    }

    renderArray(v, debugStep) {
        let arr = [];
        try {
            // Parse value if it is a JSON string, otherwise use rawValue if available
            if (Array.isArray(v.rawValue)) {
                arr = v.rawValue;
            } else if (typeof v.value === 'string') {
                arr = JSON.parse(v.value);
            } else {
                return `<div class="var-value" style="color: ${this.getTypeColor('array')}">${this.escapeHtml(v.value)}</div>`;
            }
        } catch (e) {
            return `<div class="var-value" style="color: ${this.getTypeColor('array')}">${this.escapeHtml(v.value)}</div>`;
        }

        if (!Array.isArray(arr)) return '';

        if (arr.length === 0) {
            return `<div class="array-visualizer"><div class="array-empty">Empty Array []</div></div>`;
        }

        const itemsHtml = arr.map((item, index) => {
            let classes = 'array-cell';
            let style = '';

            // Check if this specific index is being interacted with
            if (debugStep) {
                const isTargetArray = debugStep.type === 'array_op' || (debugStep.varName && debugStep.varName.startsWith(v.name));

                if (isTargetArray) {
                    // Highlighting for array methods
                    if (debugStep.arrayIndex !== undefined) {
                        if (debugStep.arrayMethod === 'push' && index === debugStep.arrayIndex) {
                            classes += ' new-item';
                        } else if (debugStep.arrayMethod === 'pop' && index === debugStep.arrayIndex) { // logic for removed items is tricky as they are gone 
                            // Actually popped items are gone from the array, so we can't style them here.
                            // But we can style the *new* last element or something?
                            // For pop, the array length decreased.
                        } else if ((debugStep.arrayMethod === 'set' || debugStep.arrayMethod === 'splice') && index == debugStep.arrayIndex) {
                            classes += ' highlight-change';
                        }
                    }

                    // Highlighting for direct assignment arr[i] = x
                    if (debugStep.arrayIndex == index) { // loose equality for string/number match
                        classes += ' highlight-change';
                    }
                }
            }

            const itemType = item === null ? 'null' : (Array.isArray(item) ? 'array' : typeof item);
            const itemColor = this.getTypeColor(itemType);
            const displayVal = (typeof item === 'object' && item !== null) ? '{_}' : String(item);

            return `
        <div class="${classes}" style="${style}">
          <div class="array-box" style="border-color: ${itemColor}; color: ${itemColor}">${this.escapeHtml(displayVal)}</div>
          <div class="array-index">${index}</div>
        </div>
      `;
        }).join('');

        return `
      <div class="array-visualizer">
        <div class="array-track-container">
          <div class="array-track">
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;
    }

    getTypeColor(type) {
        const colors = {
            number: '#60a5fa',
            string: '#34d399',
            boolean: '#fbbf24',
            object: '#a78bfa',
            array: '#fb7185',
            undefined: '#64748b',
            function: '#f472b6',
            null: '#94a3b8',
        };
        return colors[type] || '#94a3b8';
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    clear() {
        this.container.innerHTML = '<div class="var-placeholder">No variables declared yet</div>';
        this.previousVars.clear();
    }
}
