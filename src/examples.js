/**
 * CodeVision — Example Programs
 * A collection of examples demonstrating core programming concepts in multiple languages
 */

export const examples = {
  javascript: {
    input: `// ⌨️ User Input
let name = prompt("What is your name?");
console.log("Hello, " + name + "!");

let age = Number(prompt("How old are you?"));
console.log("In 5 years, you will be " + (age + 5));
`,
    variables: `// 📦 Variables & Types
// JavaScript is dynamically typed

let name = "Alex";
let age = 25;
let isStudent = true;
let score = 98.5;

console.log("Name:", name);
console.log("Age:", age);
console.log("Student:", isStudent);

// Type changes (dynamic typing)
age = "Twenty-Five";
console.log("New Age:", age);
`,
    arithmetic: `// 🔢 Arithmetic Operations
let x = 10;
let y = 3;

let sum = x + y;
let diff = x - y;
let product = x * y;
let quotient = x / y;
let remainder = x % y;

console.log("Sum:", sum);
console.log("Diff:", diff);
console.log("Product:", product);
`,
    conditions: `// 🔀 If/Else Conditions
let temperature = 25;

if (temperature > 30) {
  console.log("It's hot outside!");
} else if (temperature > 20) {
  console.log("It's nice outside.");
} else {
  console.log("It's cold.");
}
`,
    loops: `// 🔄 Loops
console.log("--- For Loop ---");
for (let i = 1; i <= 5; i++) {
  console.log("Count:", i);
}

console.log("--- While Loop ---");
let count = 3;
while (count > 0) {
  console.log("Countdown:", count);
  count--;
}
console.log("Blast off!");
`,
    functions: `// ⚡ Functions
function greet(name) {
  console.log("Hello, " + name + "!");
}

let result = greet("Alice");

function calculateArea(width, height) {
  return width * height;
}

let area = calculateArea(5, 10);
console.log("Area:", area);
`,
    arrays: `// 📋 Interactive Array Visualization
// Watch the array structure change in the Variable Inspector!

let stack = [];
console.log("Empty stack:", stack);

// Pushing elements (Watch them slide in!)
stack.push(10);
stack.push(20);
stack.push(30);
console.log("After push:", stack);

// Popping elements
let last = stack.pop();
console.log("Popped:", last);

// Queue operations
let queue = ["Start"];
queue.unshift("New First"); 
queue.push("End");        
console.log("Queue:", queue);
`,
    objects: `// 🧩 Objects
let person = {
  name: "Bob",
  age: 30,
  skills: ["JS", "HTML", "CSS"]
};

console.log("Person:", person);
console.log("Name:", person.name);

person.age = 31;
console.log("New Age:", person.age);
`,
    recursion: `// 🌀 Recursion
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

let f = factorial(5);
console.log("Factorial of 5:", f);
`
  },

  java: {
    input: `// ⌨️ User Input.java
import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    
    System.out.println("What is your name?");
    String name = scanner.nextLine();
    System.out.println("Hello, " + name + "!");
    
    System.out.println("Enter a number:");
    int num = scanner.nextInt();
    System.out.println("Double: " + (num * 2));
  }
}
`,
    variables: `// 📦 variables.java
// Java is statically typed (Visualized using Transpiler)

public class Main {
  public static void main(String[] args) {
    String name = "Alex";
    int age = 25;
    boolean isStudent = true;
    double score = 98.5;

    System.out.println("Name: " + name);
    System.out.println("Age: " + age);
    System.out.println("Student: " + isStudent);

    // Variable updates
    age = 26;
    System.out.println("New Age: " + age);
  }
}
`,
    arithmetic: `// 🔢 Arithmetic.java
public class Main {
  public static void main(String[] args) {
    int x = 10;
    int y = 3;

    int sum = x + y;
    int diff = x - y;
    int product = x * y;
    int quotient = x / y;
    int remainder = x % y;

    System.out.println("Sum: " + sum);
    System.out.println("Diff: " + diff);
    System.out.println("Product: " + product);
    
    x += 5;
    System.out.println("x += 5: " + x);
  }
}
`,
    conditions: `// 🔀 Conditions.java
public class Main {
  public static void main(String[] args) {
    int temperature = 25;

    if (temperature > 30) {
      System.out.println("It's hot outside!");
    } else if (temperature > 20) {
      System.out.println("It's nice outside.");
    } else {
      System.out.println("It's cold.");
    }
  }
}
`,
    loops: `// 🔄 Loops.java
public class Main {
  public static void main(String[] args) {
    System.out.println("--- For Loop ---");
    for (int i = 1; i <= 5; i++) {
        System.out.println("Count: " + i);
    }

    System.out.println("--- While Loop ---");
    int count = 3;
    while (count > 0) {
        System.out.println("Countdown: " + count);
        count--;
    }
    System.out.println("Blast off!");
  }
}
`,
    arrays: `// 📋 Arrays.java
// Java Arrays & ArrayLists Visualization

import java.util.ArrayList;

public class Main {
  public static void main(String[] args) {
    // Standard Array
    int[] numbers = {10, 20, 30};
    System.out.println("Array length: " + numbers.length);
    System.out.println("Element 0: " + numbers[0]);

    // ArrayList (Great for stacks!)
    ArrayList<String> stack = new ArrayList<>();
    
    // Push items
    stack.add("First");
    stack.add("Second");
    stack.add("Third");
    
    System.out.println("Stack size: " + stack.size());
    
    // Pop item (simulated visual)
    String removed = stack.remove(2); 
    
    System.out.println("Stack after pop: " + stack.size());
  }
}
`,
    functions: `// ⚡ Functions.java
public class Main {
  public static void main(String[] args) {
    greet("Alice");
    
    int area = calculateArea(5, 10);
    System.out.println("Area: " + area);
  }

  public static void greet(String name) {
    System.out.println("Hello, " + name + "!");
  }

  public static int calculateArea(int width, int height) {
    return width * height;
  }
}
`,
    objects: `// 🧩 Objects.java
// Simple implementation for visualization purposes
public class Main {
    public static void main(String[] args) {
        System.out.println("Use Classes for complex data");
        // Coming soon: Full Class Visualization
    }
}
`,
    recursion: `// 🌀 Recursion.java
public class Main {
  public static void main(String[] args) {
    int f = factorial(5);
    System.out.println("Factorial of 5: " + f);
  }

  public static int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  }
}
`
  },

  python: {
    input: `# ⌨️ User Input
name = input("What is your name? ")
print(f"Hello, {name}!")

age = int(input("How old are you? "))
print(f"In 5 years, you will be {age + 5}")
`,

    variables: `# 📦 Variables (Python)
# Visualized using JS Transpilation

name = "Alex"
age = 25
is_student = True
score = 98.5

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Student: {is_student}")

# Dynamic typing
age = "Twenty-Five"
print(f"New Age: {age}")
`,

    arithmetic: `# 🔢 Arithmetic
x = 10
y = 3

sum_val = x + y
diff = x - y
prod = x * y
quot = x / y
rem = x % y

print(f"Sum: {sum_val}")
print(f"Diff: {diff}")
print(f"Product: {prod}")
`,

    conditions: `# 🔀 Conditions
temperature = 25

if temperature > 30:
    print("It's hot outside!")
elif temperature > 20:
    print("It's nice outside.")
else:
    print("It's cold.")

# Indentation matters!
print("End of check.")
`,

    loops: `# 🔄 Loops
print("--- For Loop ---")
for i in range(1, 6):
    print(f"Count: {i}")

print("--- While Loop ---")
count = 3
while count > 0:
    print(f"Countdown: {count}")
    count = count - 1

print("Blast off!")
`,

    functions: `# ⚡ Functions
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")

def calculate_area(width, height):
    return width * height

area = calculate_area(5, 10)
print(f"Area: {area}")
`,

    arrays: `# 📋 Lists (Arrays)
# Watch lists visualize in real-time!

stack = []
print(f"Empty: {stack}")

# Append (Push)
stack.append(10)
stack.append(20)
stack.append(30)
print(f"Stack: {stack}")

# Pop
last = stack.pop()
print(f"Popped: {last}")

# Slicing
full_list = [1, 2, 3, 4, 5]
sub_list = full_list[1:4]
print(f"Slice [1:4]: {sub_list}")
`,

    objects: `# 🧩 Dictionaries (Objects)

person = {
    "name": "Bob",
    "age": 30,
    "skills": ["Python", "JS"]
}

print(f"Person: {person}")
print(f"Name: {person['name']}")

person['age'] = 31
print(f"New Age: {person['age']}")
`,

    recursion: `# 🌀 Recursion
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

f = factorial(5)
print(f"Factorial of 5: {f}")
`
  }
};
