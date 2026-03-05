
import { Transpiler } from './src/transpiler.js';

const transpiler = new Transpiler();
transpiler.setMode('java');

const javaCode = `
import java.util.Random;
import java.util.Arrays;

public class CompilerTest {

    static class Person {
        String name;
        int age;

        Person(String name, int age) {
            this.name = name;
            this.age = age;
        }

        void haveBirthday() {
            age++;
        }

        @Override
        public String toString() {
            return name + " (Age: " + age + ")";
        }
    }

    public static int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    public static void main(String[] args) {
        Random rand = new Random();

        // Generate random numbers
        int[] numbers = new int[10];
        for (int i = 0; i < numbers.length; i++) {
            numbers[i] = rand.nextInt(100);
        }

        System.out.println("Original array:");
        System.out.println(Arrays.toString(numbers));

        // Sort array
        Arrays.sort(numbers);
        System.out.println("Sorted array:");
        System.out.println(Arrays.toString(numbers));

        // Create some Person objects
        Person[] people = {
            new Person("Alice", rand.nextInt(30) + 20),
            new Person("Bob", rand.nextInt(30) + 20),
            new Person("Charlie", rand.nextInt(30) + 20)
        };

        System.out.println("\nPeople:");
        for (Person p : people) {
            System.out.println(p);
        }

        // Birthday simulation
        System.out.println("\nAfter one year:");
        for (Person p : people) {
            p.haveBirthday();
            System.out.println(p);
        }

        // Random factorial test
        int testValue = rand.nextInt(6) + 5;
        System.out.println("\nFactorial of " + testValue + " is " + factorial(testValue));

        // Switch example
        int day = rand.nextInt(7) + 1;
        System.out.print("\nRandom day: ");
        switch (day) {
            case 1 -> System.out.println("Monday");
            case 2 -> System.out.println("Tuesday");
            case 3 -> System.out.println("Wednesday");
            case 4 -> System.out.println("Thursday");
            case 5 -> System.out.println("Friday");
            case 6 -> System.out.println("Saturday");
            case 7 -> System.out.println("Sunday");
            default -> System.out.println("Invalid");
        }

        System.out.println("\nProgram completed successfully.");
    }
}
`;

console.log("--- Transpiling Java Code ---");
try {
    const jsCode = transpiler.transpile(javaCode);
    console.log("--- Transpiled JS ---");
    console.log(jsCode);
    console.log("--- Checking Syntax ---");
    // Verify syntax by creating an AsyncFunction (supports await)
    const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
    new AsyncFunction(jsCode);
    console.log("✅ Syntax Valid!");
} catch (e) {
    console.error("❌ Transpilation/Syntax Error:", e.message);
    if (e.message.includes("unexpected token")) {
        console.error("Check the transpiled code for syntax errors.");
    }
}
