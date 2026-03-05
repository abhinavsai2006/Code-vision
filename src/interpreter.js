/**
 * CodeVision — Step-by-Step JavaScript Interpreter
 * 
 * Uses Acorn to parse JS into an AST, then walks it node-by-node,
 * producing execution steps with full state snapshots at each point.
 */

import * as acorn from 'acorn';

// ─── Execution Step Types ─────────────────────────────
const StepType = {
  VAR_DECLARE: 'var_declare',
  VAR_ASSIGN: 'var_assign',
  EXPRESSION: 'expression',
  FUNCTION_CALL: 'function_call',
  FUNCTION_RETURN: 'function_return',
  FUNCTION_DECLARE: 'function_declare',
  CONDITION: 'condition',
  LOOP_ITER: 'loop_iter',
  LOOP_END: 'loop_end',
  CONSOLE_LOG: 'console_log',
  ARRAY_OP: 'array_op',
  OBJECT_OP: 'object_op',
  WAITING_INPUT: 'waiting_input',
  ERROR: 'error',
  COMPLETE: 'complete',
};

export { StepType };

// ─── Interpreter Class ─────────────────────────────
// ─── Standard Library ─────────────────────────────
const StandardLibrary = {
  // Java Mocks
  'java.util.Scanner': function (source) {
    return {
      nextLine: async function () { return await __input__(); },
      nextInt: async function () { return Number(await __input__()); },
      next: async function () { return await __input__(); },
      nextDouble: async function () { return parseFloat(await __input__()); }
    };
  },
  'java.util.Random': function () {
    return {
      nextInt: function (max) { return Math.floor(Math.random() * max); },
      nextDouble: function () { return Math.random(); }
    };
  },
  'java.util.ArrayList': Array,
  'java.util.Arrays': {
    toString: (arr) => JSON.stringify(arr),
    sort: (arr) => arr.sort((a, b) => a - b),
    asList: (...args) => args
  },
  'java.lang.System': {
    out: {
      println: (msg) => console.log(msg),
      print: (msg) => process.stdout.write(msg + '')
    }
  },

  // Python Mocks
  'math': {
    sqrt: Math.sqrt,
    pow: Math.pow,
    floor: Math.floor,
    ceil: Math.ceil,
    pi: Math.PI,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan
  },
  'random': {
    randint: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
    random: Math.random,
    choice: (seq) => seq[Math.floor(Math.random() * seq.length)],
    shuffle: (seq) => {
      for (let i = seq.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seq[i], seq[j]] = [seq[j], seq[i]];
      }
    },
    randrange: (start, stop, step = 1) => {
      // simplified
      return Math.floor(Math.random() * (stop - start)) + start;
    }
  },
  'time': {
    sleep: async (sec) => new Promise(r => setTimeout(r, sec * 1000)),
    time: () => Date.now() / 1000
  },
  'datetime': {
    datetime: {
      now: () => new Date()
    }
  },

  // Python Builtins
  'range': (start, stop, step = 1) => {
    if (stop === undefined) { stop = start; start = 0; }
    const arr = [];
    if (step > 0) {
      for (let i = start; i < stop; i += step) arr.push(i);
    } else {
      for (let i = start; i > stop; i += step) arr.push(i);
    }
    return arr;
  }
};

// ─── Interpreter Class ─────────────────────────────
export class Interpreter {
  constructor() {
    this.steps = [];
    this.scopes = [];
    this.callStack = [];
    this.output = [];
    this.heapObjects = new Map();
    this.heapIdCounter = 0;
    this.aborted = false;
    this.maxSteps = 500;
    this.inputResolver = null;
    this.isWaitingForInput = false;
    this.params = {};
  }

  /**
   * Parse and interpret the code, producing execution steps.
   * Returns an array of step objects.
   */
  async run(code) {
    this.steps = [];
    this.scopes = [];
    this.callStack = [];
    this.output = [];
    this.heapObjects = new Map();
    this.heapIdCounter = 0;
    this.aborted = false;
    this.inputResolver = null;
    this.isWaitingForInput = false;

    try {
      const ast = acorn.parse(code, {
        ecmaVersion: 2022,
        sourceType: 'module',
        allowAwaitOutsideFunction: true,
        locations: true,
      });

      // Create global scope
      this.pushScope('Global', 0);
      this.callStack.push({ name: 'Global', line: 1 });

      // Inject some globals if needed
      this.setVar('__import__', async (mod) => this.resolveImport(mod));

      // Execute top-level statements
      await this.execBlock(ast.body);

      // Mark complete
      this.addStep({
        type: StepType.COMPLETE,
        line: null,
        description: '✅ Program execution completed!',
        icon: '✅',
      });

    } catch (e) {
      if (e.message?.startsWith('SyntaxError:') || e instanceof SyntaxError) {
        this.addStep({
          type: StepType.ERROR,
          line: e.loc?.line || null,
          description: `❌ Syntax Error: ${e.message}`,
          icon: '❌',
        });
      } else if (e.message === 'ABORT') {
        // Max steps reached
      } else if (e.message === 'HALT') {
        // Explicit halt
      } else if (e.message?.includes('__input__ is not defined')) {
        // ignore internal input error
      } else {
        console.error(e);
        this.addStep({
          type: StepType.ERROR,
          line: null,
          description: `❌ Error: ${e.message}`,
          icon: '❌',
        });
      }
    }

    return this.steps;
  }

  // ─── Import Resolution ─────────────────────────────
  async resolveImport(moduleName) {
    if (StandardLibrary[moduleName]) {
      return StandardLibrary[moduleName];
    }
    // Fallback for sub-modules e.g. java.util.concurrent -> just return empty object or error
    // Try fuzzy match?
    if (moduleName.startsWith('java.')) return {}; // Mock empty package

    this.addStep({
      type: StepType.ERROR,
      line: null,
      description: `⚠️ Module '${moduleName}' not found in standard library`,
      icon: '⚠️'
    });
    return {};
  }

  // ─── Input Handling ──────────────────────────
  async requestInput(promptText) {
    this.addStep({
      type: StepType.WAITING_INPUT,
      line: null,
      description: `Waiting for input: "${promptText || '...'}"`,
      icon: '⌨️',
      prompt: promptText
    });

    this.isWaitingForInput = true;
    return new Promise(resolve => {
      this.inputResolver = resolve;
    });
  }

  provideInput(value) {
    if (this.inputResolver) {
      this.isWaitingForInput = false;
      const resolve = this.inputResolver;
      this.inputResolver = null;
      resolve(value);
    }
  }

  // ─── Scope Management ──────────────────────────
  pushScope(name, line) {
    this.scopes.push({ name, vars: {}, line });
  }

  popScope() {
    return this.scopes.pop();
  }

  currentScope() {
    return this.scopes[this.scopes.length - 1];
  }

  setVar(name, value) {
    // Set in current scope
    this.currentScope().vars[name] = value;
  }

  getVar(name) {
    // Search scopes from innermost to outermost
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (name in this.scopes[i].vars) {
        return this.scopes[i].vars[name];
      }
    }
    // Check Standard Library for globals (like Math, console)
    if (name === 'Math') return Math;
    if (name === 'JSON') return JSON;
    if (name === 'console') return { log: (...args) => console.log(...args) }; // Dummy console

    if (name === 'Scanner') return StandardLibrary['java.util.Scanner'];
    if (name === 'Random') return StandardLibrary['java.util.Random'];
    if (name === 'System') return StandardLibrary['java.lang.System'];
    if (name === 'ArrayList') return StandardLibrary['java.util.ArrayList'];

    // Python Globals
    if (name === 'range') return StandardLibrary['range'];

    return undefined;
  }

  updateVar(name, value) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (name in this.scopes[i].vars) {
        this.scopes[i].vars[name] = value;
        return;
      }
    }
    // If not found, set in current scope
    this.currentScope().vars[name] = value;
  }

  // ─── Step Recording ────────────────────────────
  addStep(stepInfo) {
    if (this.aborted) throw new Error('ABORT');
    if (this.steps.length >= this.maxSteps) {
      this.steps.push({
        type: StepType.ERROR,
        line: null,
        description: `⚠️ Maximum steps (${this.maxSteps}) reached. Execution stopped to prevent infinite loops.`,
        icon: '⚠️',
        variables: this.getAllVariables(),
        callStack: [...this.callStack],
        output: [...this.output],
        heap: this.getHeapSnapshot(),
      });
      this.aborted = true;
      throw new Error('ABORT');
    }

    this.steps.push({
      ...stepInfo,
      variables: this.getAllVariables(),
      callStack: [...this.callStack],
      output: [...this.output],
      heap: this.getHeapSnapshot(),
    });
  }

  getAllVariables() {
    const vars = [];
    for (const scope of this.scopes) {
      for (const [name, value] of Object.entries(scope.vars)) {
        if (typeof value === 'function' || (typeof value === 'object' && value !== null && value.__isFunction)) {
          continue; // skip function declarations in variable view
        }
        if (name === '__import__') continue;
        vars.push({
          name,
          value: this.formatValue(value),
          rawValue: value,
          type: this.getType(value),
          scope: scope.name,
        });
      }
    }
    return vars;
  }

  getType(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'object') {
      try { return JSON.stringify(value); } catch { return '{...}'; }
    }
    return String(value);
  }

  getHeapSnapshot() {
    const heap = [];
    for (const [id, obj] of this.heapObjects) {
      heap.push({ id, ...obj });
    }
    return heap;
  }

  allocHeap(name, value) {
    const id = `0x${(0x1000 + this.heapIdCounter * 0x20).toString(16)}`;
    this.heapIdCounter++;
    this.heapObjects.set(id, { name, value: this.formatValue(value), type: this.getType(value) });
    return id;
  }

  // ─── AST Execution ─────────────────────────────
  async execBlock(statements) {
    for (const stmt of statements) {
      if (this.aborted) return;
      await this.execStatement(stmt);
    }
  }

  async execStatement(node) {
    if (this.aborted) return;

    switch (node.type) {
      case 'VariableDeclaration': return await this.execVarDeclaration(node);
      case 'FunctionDeclaration': return await this.execFunctionDeclaration(node);
      case 'ExpressionStatement': return await this.execExpressionStatement(node);
      case 'ReturnStatement': return await this.execReturnStatement(node);
      case 'IfStatement': return await this.execIfStatement(node);
      case 'ForStatement': return await this.execForStatement(node);
      case 'WhileStatement': return await this.execWhileStatement(node);
      case 'ForOfStatement': return await this.execForOfStatement(node);
      case 'BlockStatement': return await this.execBlock(node.body);
      case 'ImportDeclaration': return await this.execImportDeclaration(node);
      case 'EmptyStatement': return;
      default:
        // Try to evaluate as expression
        await this.evalExpression(node);
    }
  }

  // ─── For Of Loop ───────────────────────────────
  async execForOfStatement(node) {
    const iterable = await this.evalExpression(node.right);

    let iterCount = 0;
    const maxIter = 100; // Safety limit from other loops

    if (!iterable || (typeof iterable[Symbol.iterator] !== 'function')) {
      this.addStep({
        type: StepType.ERROR,
        line: node.loc.start.line,
        description: `❌ Not iterable: ${this.expressionToString(node.right)}`,
        icon: '❌'
      });
      return;
    }

    for (const item of iterable) {
      if (this.aborted) return;
      if (iterCount >= maxIter) {
        this.addStep({
          type: StepType.LOOP_END,
          line: node.loc.start.line,
          description: `⚠️ Loop stopped after ${maxIter} iterations`,
          icon: '⚠️',
        });
        break;
      }

      // Assign loop variable
      let varName = '?';
      if (node.left.type === 'VariableDeclaration') {
        const decl = node.left.declarations[0];
        varName = decl.id.name;
        this.setVar(varName, item);
      } else if (node.left.type === 'Identifier') {
        varName = node.left.name;
        this.updateVar(varName, item);
      }

      this.addStep({
        type: StepType.LOOP_ITER,
        line: node.loc.start.line,
        description: `Loop iter ${iterCount + 1}: <code>${varName}</code> = <code>${this.formatValue(item)}</code>`,
        icon: '🔄',
        varName: varName,
        varValue: this.formatValue(item),
        iteration: iterCount + 1
      });

      // Execute Body
      if (node.body.type === 'BlockStatement') {
        await this.execBlock(node.body.body);
      } else {
        await this.execStatement(node.body);
      }

      iterCount++;
    }

    this.addStep({
      type: StepType.LOOP_END,
      line: node.loc.start.line,
      description: `Loop finished`,
      icon: '🏁',
    });
  }

  // ─── Import Declaration ────────────────────────
  async execImportDeclaration(node) {
    const source = node.source.value;
    const moduleExports = await this.resolveImport(source);

    for (const specifier of node.specifiers) {
      if (specifier.type === 'ImportDefaultSpecifier') {
        this.setVar(specifier.local.name, moduleExports);
      } else if (specifier.type === 'ImportSpecifier') {
        const importedName = specifier.imported.name;
        this.setVar(specifier.local.name, moduleExports[importedName]);
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        this.setVar(specifier.local.name, moduleExports);
      }
    }

    this.addStep({
      type: StepType.VAR_DECLARE,
      line: node.loc.start.line,
      description: `Imported module <code>${source}</code>`,
      icon: '📦',
    });
  }

  // ─── Variable Declaration ──────────────────────
  // ─── Variable Declaration ──────────────────────
  async execVarDeclaration(node) {
    const kind = node.kind; // let, const, var
    for (const decl of node.declarations) {
      const value = decl.init ? await this.evalExpression(decl.init) : undefined;

      if (decl.id.type === 'ObjectPattern') {
        // Destructuring: const { x, y } = obj;
        await this.execDestructuring(decl.id, value, kind, node.loc.start.line);
      } else {
        // Simple assignment: const x = val;
        const name = decl.id.name;
        this.setVar(name, value);

        // Track heap allocation for arrays/objects
        if (typeof value === 'object' && value !== null) {
          this.allocHeap(name, value);
        }
        this.addStepForVar(name, value, kind, node.loc.start.line);
      }
    }
  }

  async execDestructuring(pattern, value, kind, line) {
    if (pattern.type === 'ObjectPattern') {
      for (const prop of pattern.properties) {
        const key = prop.key.name;
        const val = value ? value[key] : undefined;
        const localName = prop.value.name;

        this.setVar(localName, val);
        this.addStepForVar(localName, val, kind, line);
      }
    }
  }

  addStepForVar(name, value, kind, line) {
    const typeStr = this.getType(value);
    const valueStr = this.formatValue(value);

    let icon = '📦';
    if (typeStr === 'number') icon = '🔢';
    else if (typeStr === 'string') icon = '📝';
    else if (typeStr === 'boolean') icon = '✅';
    else if (typeStr === 'array') icon = '📋';
    else if (typeStr === 'object') icon = '🧩';

    this.addStep({
      type: StepType.VAR_DECLARE,
      line: line,
      description: `Declared <code>${kind} ${name}</code> = <code>${valueStr}</code> <span class="var-type-badge var-type-${typeStr}">${typeStr}</span>`,
      icon,
      varName: name,
      varValue: valueStr,
      varType: typeStr,
    });
  }

  // ─── Function Declaration ──────────────────────
  async execFunctionDeclaration(node) {
    const name = node.id.name;
    const params = node.params.map(p => p.name);

    // Store function as a callable
    this.setVar(name, {
      __isFunction: true,
      name,
      params,
      body: node.body,
      line: node.loc.start.line,
    });

    this.addStep({
      type: StepType.FUNCTION_DECLARE,
      line: node.loc.start.line,
      description: `Declared function <code>${name}(${params.join(', ')})</code>`,
      icon: '⚡',
      varName: name,
    });
  }

  // ─── Expression Statement ──────────────────────
  async execExpressionStatement(node) {
    const expr = node.expression;

    // Special handling for assignment expressions
    if (expr.type === 'AssignmentExpression') {
      return await this.execAssignment(expr, node.loc.start.line);
    }

    // Special handling for update expressions (i++, i--)
    if (expr.type === 'UpdateExpression') {
      return await this.execUpdate(expr, node.loc.start.line);
    }

    // Check for console.log
    if (expr.type === 'CallExpression' &&
      expr.callee.type === 'MemberExpression' &&
      expr.callee.object.name === 'console' &&
      expr.callee.property.name === 'log') {
      const args = await Promise.all(expr.arguments.map(async a => await this.evalExpression(a)));
      const output = args.map(a => this.formatValue(a)).join(' ');
      this.output.push(output);

      this.addStep({
        type: StepType.CONSOLE_LOG,
        line: node.loc.start.line,
        description: `Output: <code>${output}</code>`,
        icon: '🖥️',
        outputValue: output,
      });
      return;
    }

    // General expression
    const result = await this.evalExpression(expr);

    // Only add step for function calls at top level
    if (expr.type === 'CallExpression') {
      // Step already added inside function execution
      return;
    }
  }

  // ─── Assignment ────────────────────────────────
  async execAssignment(expr, line) {
    const value = await this.evalExpression(expr.right);

    if (expr.left.type === 'Identifier') {
      const name = expr.left.name;
      const oldValue = this.getVar(name);

      // Handle compound assignments
      let finalValue = value;
      if (expr.operator === '+=') finalValue = oldValue + value;
      else if (expr.operator === '-=') finalValue = oldValue - value;
      else if (expr.operator === '*=') finalValue = oldValue * value;
      else if (expr.operator === '/=') finalValue = oldValue / value;

      this.updateVar(name, finalValue);

      if (typeof finalValue === 'object' && finalValue !== null) {
        this.allocHeap(name, finalValue);
      }

      this.addStep({
        type: StepType.VAR_ASSIGN,
        line,
        description: `Updated <code>${name}</code> = <code>${this.formatValue(finalValue)}</code> (was <code>${this.formatValue(oldValue)}</code>)`,
        icon: '✏️',
        varName: name,
        varValue: this.formatValue(finalValue),
        varType: this.getType(finalValue),
        oldValue: this.formatValue(oldValue),
      });
    } else if (expr.left.type === 'MemberExpression') {
      const obj = await this.evalExpression(expr.left.object);
      const prop = expr.left.computed
        ? await this.evalExpression(expr.left.property)
        : expr.left.property.name;

      obj[prop] = value;

      const objName = expr.left.object.name || 'object';
      const isArray = Array.isArray(obj);

      this.addStep({
        type: StepType.VAR_ASSIGN,
        line,
        description: `Set <code>${objName}[${JSON.stringify(prop)}]</code> = <code>${this.formatValue(value)}</code>`,
        icon: '✏️',
        varName: `${objName}[${prop}]`,
        varValue: this.formatValue(value),
        varType: this.getType(value),
        // Array specific metadata
        isArrayOp: isArray,
        arrayMethod: 'set',
        arrayIndex: prop,
      });
    }
  }

  // ─── Update Expression (i++, i--) ──────────────
  async execUpdate(expr, line) {
    const name = expr.argument.name;
    const oldValue = this.getVar(name);
    const newValue = expr.operator === '++' ? oldValue + 1 : oldValue - 1;
    this.updateVar(name, newValue);

    this.addStep({
      type: StepType.VAR_ASSIGN,
      line,
      description: `Updated <code>${name}${expr.operator}</code> → <code>${newValue}</code> (was <code>${oldValue}</code>)`,
      icon: '🔄',
      varName: name,
      varValue: String(newValue),
      varType: 'number',
      oldValue: String(oldValue),
    });
  }

  // ─── If Statement ─────────────────────────────
  async execIfStatement(node) {
    const condValue = await this.evalExpression(node.test);
    const condStr = this.expressionToString(node.test);

    this.addStep({
      type: StepType.CONDITION,
      line: node.loc.start.line,
      description: `Condition <code>${condStr}</code> is <code>${condValue}</code> → ${condValue ? '✅ entering if block' : '❌ skipping if block'}`,
      icon: condValue ? '✅' : '❌',
      conditionResult: condValue,
    });

    if (condValue) {
      if (node.consequent.type === 'BlockStatement') {
        await this.execBlock(node.consequent.body);
      } else {
        await this.execStatement(node.consequent);
      }
    } else if (node.alternate) {
      if (node.alternate.type === 'IfStatement') {
        await this.execIfStatement(node.alternate);
      } else if (node.alternate.type === 'BlockStatement') {
        this.addStep({
          type: StepType.CONDITION,
          line: node.alternate.loc.start.line,
          description: `Entering <code>else</code> block`,
          icon: '🔀',
        });
        await this.execBlock(node.alternate.body);
      } else {
        await this.execStatement(node.alternate);
      }
    }
  }

  // ─── For Loop ──────────────────────────────────
  async execForStatement(node) {
    // Init
    if (node.init) {
      if (node.init.type === 'VariableDeclaration') {
        await this.execVarDeclaration(node.init);
      } else {
        await this.execAssignment(node.init, node.init.loc?.start?.line || node.loc.start.line);
      }
    }

    let iterCount = 0;
    const maxIter = 100;

    while (true) {
      if (this.aborted) return;
      if (iterCount >= maxIter) {
        this.addStep({
          type: StepType.LOOP_END,
          line: node.loc.start.line,
          description: `⚠️ Loop stopped after ${maxIter} iterations (safety limit)`,
          icon: '⚠️',
        });
        break;
      }

      // Test condition
      if (node.test) {
        const condValue = await this.evalExpression(node.test);
        const condStr = this.expressionToString(node.test);

        this.addStep({
          type: StepType.LOOP_ITER,
          line: node.loc.start.line,
          description: `Loop iteration ${iterCount + 1}: <code>${condStr}</code> = <code>${condValue}</code>`,
          icon: '🔄',
          conditionResult: condValue,
          iteration: iterCount + 1,
        });

        if (!condValue) {
          this.addStep({
            type: StepType.LOOP_END,
            line: node.loc.start.line,
            description: `Loop ended: condition <code>${condStr}</code> is <code>false</code>`,
            icon: '🏁',
          });
          break;
        }
      }

      // Body
      if (node.body.type === 'BlockStatement') {
        await this.execBlock(node.body.body);
      } else {
        await this.execStatement(node.body);
      }

      // Update
      if (node.update) {
        if (node.update.type === 'UpdateExpression') {
          await this.execUpdate(node.update, node.update.loc?.start?.line || node.loc.start.line);
        } else if (node.update.type === 'AssignmentExpression') {
          await this.execAssignment(node.update, node.update.loc?.start?.line || node.loc.start.line);
        } else {
          await this.evalExpression(node.update);
        }
      }

      iterCount++;
    }
  }

  // ─── While Loop ────────────────────────────────
  async execWhileStatement(node) {
    let iterCount = 0;
    const maxIter = 100;

    while (true) {
      if (this.aborted) return;
      if (iterCount >= maxIter) {
        this.addStep({
          type: StepType.LOOP_END,
          line: node.loc.start.line,
          description: `⚠️ Loop stopped after ${maxIter} iterations (safety limit)`,
          icon: '⚠️',
        });
        break;
      }

      const condValue = await this.evalExpression(node.test);
      const condStr = this.expressionToString(node.test);

      this.addStep({
        type: StepType.LOOP_ITER,
        line: node.loc.start.line,
        description: `While loop check: <code>${condStr}</code> = <code>${condValue}</code>`,
        icon: '🔄',
        conditionResult: condValue,
        iteration: iterCount + 1,
      });

      if (!condValue) {
        this.addStep({
          type: StepType.LOOP_END,
          line: node.loc.start.line,
          description: `While loop ended`,
          icon: '🏁',
        });
        break;
      }

      if (node.body.type === 'BlockStatement') {
        await this.execBlock(node.body.body);
      } else {
        await this.execStatement(node.body);
      }

      iterCount++;
    }
  }

  // ─── Return Statement ──────────────────────────
  async execReturnStatement(node) {
    const value = node.argument ? await this.evalExpression(node.argument) : undefined;

    this.addStep({
      type: StepType.FUNCTION_RETURN,
      line: node.loc.start.line,
      description: `Return <code>${this.formatValue(value)}</code>`,
      icon: '↩️',
      returnValue: value,
    });

    // Signal return by throwing a special object
    throw { __return: true, value };
  }

  // ─── Expression Evaluation ─────────────────────
  async evalExpression(node) {
    if (this.aborted) return undefined;

    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier':
        return this.getVar(node.name);

      case 'BinaryExpression':
      case 'LogicalExpression':
        return await this.evalBinary(node);

      case 'UnaryExpression':
        return await this.evalUnary(node);

      case 'AwaitExpression':
        return await this.evalExpression(node.argument);

      case 'UpdateExpression':
        return await this.evalUpdate(node);

      case 'AssignmentExpression': {
        const val = await this.evalExpression(node.right);
        if (node.left.type === 'Identifier') {
          let finalVal = val;
          if (node.operator === '+=') finalVal = this.getVar(node.left.name) + val;
          else if (node.operator === '-=') finalVal = this.getVar(node.left.name) - val;
          else if (node.operator === '*=') finalVal = this.getVar(node.left.name) * val;
          else if (node.operator === '/=') finalVal = this.getVar(node.left.name) / val;
          this.updateVar(node.left.name, finalVal);
          return finalVal;
        }
        return val;
      }

      case 'CallExpression':
        return await this.evalCall(node);

      case 'MemberExpression':
        return await this.evalMember(node);

      case 'ArrayExpression':
        return await Promise.all(node.elements.map(async el => el ? await this.evalExpression(el) : undefined));

      case 'ObjectExpression': {
        const obj = {};
        for (const prop of node.properties) {
          const key = prop.key.name || prop.key.value;
          obj[key] = await this.evalExpression(prop.value);
        }
        return obj;
      }

      case 'ConditionalExpression': {
        const test = await this.evalExpression(node.test);
        return test ? await this.evalExpression(node.consequent) : await this.evalExpression(node.alternate);
      }

      case 'TemplateLiteral': {
        let result = '';
        for (let i = 0; i < node.quasis.length; i++) {
          result += node.quasis[i].value.cooked;
          if (i < node.expressions.length) {
            result += String(await this.evalExpression(node.expressions[i]));
          }
        }
        return result;
      }

      case 'ArrowFunctionExpression':
      case 'FunctionExpression': {
        const params = node.params.map(p => p.name);
        return {
          __isFunction: true,
          name: node.id?.name || '<anonymous>',
          params,
          body: node.body,
          line: node.loc?.start?.line,
        };
      }

      default:
        return undefined;
    }
  }

  async evalBinary(node) {
    const left = await this.evalExpression(node.left);
    const right = await this.evalExpression(node.right);

    switch (node.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '**': return left ** right;
      case '==': return left == right;
      case '!=': return left != right;
      case '===': return left === right;
      case '!==': return left !== right;
      case '<': return left < right;
      case '>': return left > right;
      case '<=': return left <= right;
      case '>=': return left >= right;
      case '&&': return left && right;
      case '||': return left || right;
      default: return undefined;
    }
  }

  async evalUnary(node) {
    const arg = await this.evalExpression(node.argument);
    switch (node.operator) {
      case '-': return -arg;
      case '+': return +arg;
      case '!': return !arg;
      case 'typeof': return typeof arg;
      default: return undefined;
    }
  }

  async evalUpdate(node) {
    const name = node.argument.name;
    const oldValue = this.getVar(name);
    const newValue = node.operator === '++' ? oldValue + 1 : oldValue - 1;
    this.updateVar(name, newValue);
    return node.prefix ? newValue : oldValue;
  }

  async evalCall(node) {
    // Handle Input
    if (node.callee.name === '__input__' ||
      (node.callee.type === 'MemberExpression' && node.callee.property.name === '__input__')) {
      const args = await Promise.all(node.arguments.map(async a => await this.evalExpression(a)));
      return await this.requestInput(args[0]);
    }

    if (node.callee.name === 'prompt') {
      const args = await Promise.all(node.arguments.map(async a => await this.evalExpression(a)));
      return await this.requestInput(args[0]);
    }

    // Handle console.log
    if (node.callee.type === 'MemberExpression' &&
      node.callee.object.name === 'console' &&
      node.callee.property.name === 'log') {
      const args = await Promise.all(node.arguments.map(async a => await this.evalExpression(a)));
      const output = args.map(a => typeof a === 'string' ? a : this.formatValue(a)).join(' ');
      this.output.push(output);

      this.addStep({
        type: StepType.CONSOLE_LOG,
        line: node.loc.start.line,
        description: `Output: <code>${output}</code>`,
        icon: '🖥️',
        outputValue: output,
      });
      return undefined;
    }

    // Handle built-in methods
    if (node.callee.type === 'MemberExpression') {
      const obj = await this.evalExpression(node.callee.object);
      const method = node.callee.property.name;
      const args = await Promise.all(node.arguments.map(async a => await this.evalExpression(a)));

      // Array methods
      if (Array.isArray(obj)) {
        if (method === 'push') {
          obj.push(...args);
          this.addStep({
            type: StepType.ARRAY_OP,
            line: node.loc.start.line,
            description: `Array <code>push(${args.map(a => this.formatValue(a)).join(', ')})</code> → length ${obj.length}`,
            icon: '📋',
            arrayMethod: 'push',
            arrayArgs: args,
            arrayIndex: obj.length - 1 // Index of new element
          });
          return obj.length;
        }
        if (method === 'pop') {
          const val = obj.pop();
          this.addStep({
            type: StepType.ARRAY_OP,
            line: node.loc.start.line,
            description: `Array <code>pop()</code> → <code>${this.formatValue(val)}</code>`,
            icon: '📋',
            arrayMethod: 'pop',
            arrayIndex: obj.length // Index that was removed
          });
          return val;
        }
        if (method === 'shift') {
          const val = obj.shift();
          this.addStep({
            type: StepType.ARRAY_OP,
            line: node.loc.start.line,
            description: `Array <code>shift()</code> → <code>${this.formatValue(val)}</code>`,
            icon: '📋',
            arrayMethod: 'shift',
          });
          return val;
        }
        if (method === 'unshift') {
          const len = obj.unshift(...args);
          this.addStep({
            type: StepType.ARRAY_OP,
            line: node.loc.start.line,
            description: `Array <code>unshift(${args.map(a => this.formatValue(a)).join(', ')})</code>`,
            icon: '📋',
            arrayMethod: 'unshift',
            arrayArgs: args,
          });
          return len;
        }
        if (method === 'splice') {
          const res = obj.splice(...args);
          this.addStep({
            type: StepType.ARRAY_OP,
            line: node.loc.start.line,
            description: `Array <code>splice(...)</code>`,
            icon: '📋',
            arrayMethod: 'splice',
          });
          return res;
        }
      }

      // String methods (basic support)
      if (typeof obj === 'string') {
        if (typeof obj[method] === 'function') {
          return obj[method](...args);
        }
      }

      // Object methods
      if (typeof obj === 'object' && obj !== null && obj[method]) {
        if (typeof obj[method] === 'function') {
          return obj[method](...args);
        }
      }
    }

    // Handle User Defined Functions OR Standard Library Functions
    let func;
    if (node.callee.type === 'Identifier') {
      func = this.getVar(node.callee.name);
    } else {
      func = await this.evalExpression(node.callee);
    }

    const args = await Promise.all(node.arguments.map(async a => await this.evalExpression(a)));

    // 1. User Defined Function (Simulated)
    if (func && func.__isFunction) {
      this.pushScope(func.name, node.loc.start.line);
      this.callStack.push({ name: func.name, line: node.loc.start.line });

      // Bind args to params
      for (let i = 0; i < func.params.length; i++) {
        this.setVar(func.params[i], args[i]);
      }

      this.addStep({
        type: StepType.FUNCTION_CALL,
        line: node.loc.start.line,
        description: `Calling <code>${func.name}(${args.map(a => this.formatValue(a)).join(', ')})</code>`,
        icon: '📞',
        funcName: func.name,
      });

      let returnValue;
      try {
        await this.execBlock(func.body.body);
      } catch (e) {
        if (e && e.__return) {
          returnValue = e.value;
        } else {
          throw e;
        }
      }

      this.popScope();
      this.callStack.pop();

      return returnValue;
    }

    // 2. Native/Standard Library Function
    if (typeof func === 'function') {
      // Native or Standard Lib function
      return await func.apply(null, args);
    }

    return undefined;
  }

  async evalMember(node) {
    const obj = await this.evalExpression(node.object);
    const prop = node.computed ? await this.evalExpression(node.property) : node.property.name;

    if (!obj) return undefined;
    return obj[prop];
  }

  // ─── Helpers ──────────────────────────────────
  expressionToString(node) {
    if (!node) return '';
    // This is a naive reconstruction for display
    if (node.type === 'BinaryExpression') {
      const left = node.left.type === 'Identifier' ? node.left.name : (node.left.raw || '...');
      const right = node.right.type === 'Identifier' ? node.right.name : (node.right.raw || '...');
      return `${left} ${node.operator} ${right}`;
    }
    if (node.type === 'Identifier') return node.name;
    if (node.type === 'Literal') return String(node.value);
    return 'condition';
  }
}
