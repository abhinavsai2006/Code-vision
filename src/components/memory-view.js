/**
 * CodeVision — Memory View Component
 * Visual representation of stack and heap memory
 */

export class MemoryView {
    constructor(stackContainerId, heapContainerId) {
        this.stackContainer = document.getElementById(stackContainerId);
        this.heapContainer = document.getElementById(heapContainerId);
        this.addressCounter = 0x100;
    }

    update(variables, heap, changedVarName) {
        this.renderStackMemory(variables, changedVarName);
        this.renderHeapMemory(heap, variables);
    }

    renderStackMemory(variables, changedVarName) {
        if (!variables || variables.length === 0) {
            this.stackContainer.innerHTML = '<div class="var-placeholder" style="font-size:10px;">Empty</div>';
            return;
        }

        const html = variables.map((v, i) => {
            const addr = `0x${(this.addressCounter + i * 8).toString(16).toUpperCase().padStart(4, '0')}`;
            const isHighlight = v.name === changedVarName;
            const isRef = v.type === 'array' || v.type === 'object';

            return `
        <div class="memory-cell ${isHighlight ? 'highlight' : ''}">
          <span class="memory-addr">${addr}</span>
          <span class="memory-label">${v.name}</span>
          ${isRef
                    ? `<span class="memory-ref-arrow">→ heap</span>`
                    : `<span class="memory-val">${this.truncate(v.value, 12)}</span>`
                }
        </div>
      `;
        }).join('');

        this.stackContainer.innerHTML = html;
    }

    renderHeapMemory(heap, variables) {
        if (!heap || heap.length === 0) {
            this.heapContainer.innerHTML = '<div class="var-placeholder" style="font-size:10px;">Empty</div>';
            return;
        }

        const html = heap.map(obj => {
            return `
        <div class="memory-cell">
          <span class="memory-addr">${obj.id}</span>
          <span class="memory-label">${obj.name}</span>
          <span class="memory-val">${this.truncate(obj.value, 16)}</span>
        </div>
      `;
        }).join('');

        this.heapContainer.innerHTML = html;
    }

    truncate(str, maxLen) {
        str = String(str);
        if (str.length > maxLen) return str.slice(0, maxLen) + '…';
        return str;
    }

    clear() {
        this.stackContainer.innerHTML = '<div class="var-placeholder" style="font-size:10px;">Empty</div>';
        this.heapContainer.innerHTML = '<div class="var-placeholder" style="font-size:10px;">Empty</div>';
    }
}
