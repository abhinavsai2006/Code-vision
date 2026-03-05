
import { Transpiler } from './src/transpiler.js';

const t = new Transpiler();
t.setMode('java');

const javaCode = `
public class Main {
  public static void main(String[] args) {
    int x = 10;
    System.out.println("Hello: " + x);
    
    for (int i=0; i<5; i++) {
        System.out.println(i);
    }
  }
  
  public static int foo(int n) {
    return n * 2;
  }
}
`;

console.log("--- Original Java ---");
console.log(javaCode);

const jsCode = t.transpile(javaCode);

console.log("\n--- Transpiled JS ---");
console.log(jsCode);

// Verify if it is valid JS by trying to parse it (mock)
try {
    new Function(jsCode);
    // Note: new Function wraps code in a function, but 'function main' inside it is fine.
    // However, 'try { main() }' at end will run immediately. 
    // We just want to check syntax.
    console.log("\n✅ Syntax check passed (Valid JS)");
} catch (e) {
    console.error("\n❌ Syntax check FAILED:", e.message);
}
