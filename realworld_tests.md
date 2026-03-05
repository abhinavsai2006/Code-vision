
# Real-World Testing Scenarios for CodeVision IDE

Here are two complex, real-world scenarios to test the limits of your compiler and interpreter.

## 1. Python Data Analysis Simulation
**Tests:** Imports, Lists, Dictionaries, f-strings, Math, Random, Functions, Loops.

```python
import math
from random import randint
import time

# Simulation Parameters
class_size = 5
subjects = ["Math", "Science", "History"]

print(f"--- Class Simulation (Students: {class_size}) ---")

students = []

# 1. Generate Random Data
for i in range(class_size):
    student = {
        "id": i + 1,
        "name": f"Student_{i+1}",
        "scores": []
    }
    # Assign random scores
    for subj in subjects:
        score = randint(50, 100)
        student["scores"].append(score)
    
    students.append(student)

# 2. Analyze Data
print("\n--- Processing Results ---")
top_student = None
highest_avg = 0.0

for s in students:
    # Calculate Average
    total = 0
    for score in s["scores"]:
        total = total + score
    
    avg = total / len(s["scores"])
    
    # Use Math module
    avg_rounded = math.floor(avg * 10) / 10
    
    print(f"{s['name']}: Scores {s['scores']} -> Avg: {avg_rounded}")
    
    if avg > highest_avg:
        highest_avg = avg
        top_student = s

# 3. Final Report
print(f"\n🏆 Top Student: {top_student['name']} with {highest_avg}")
print("Simulation Complete.")
```

## 2. Java Mini-Banking System
**Tests:** Imports (ArrayList, Scanner), Classes, Methods, Constructors, State Management.

```java
import java.util.ArrayList;
import java.util.Scanner;
import java.util.Random;

public class BankingSystem {

    static class Account {
        String owner;
        double balance;
        ArrayList<String> history;

        Account(String owner, double initialBalance) {
            this.owner = owner;
            this.balance = initialBalance;
            this.history = new ArrayList<>();
            this.history.add("Account created with $" + initialBalance);
        }

        void deposit(double amount) {
            balance += amount;
            history.add("Deposited: $" + amount);
            System.out.println("✅ " + owner + " deposited $" + amount);
        }

        void withdraw(double amount) {
            if (amount <= balance) {
                balance -= amount;
                history.add("Withdrew: $" + amount);
                System.out.println("✅ " + owner + " withdrew $" + amount);
            } else {
                System.out.println("❌ " + owner + " insufficient funds!");
            }
        }

        void printStatement() {
            System.out.println("\n--- Statement for " + owner + " ---");
            System.out.println("Current Balance: $" + balance);
            System.out.println("Transaction History:");
            for (int i = 0; i < history.size(); i++) {
                System.out.println((i + 1) + ". " + history.get(i));
            }
        }
    }

    public static void main(String[] args) {
        System.out.println("=== Java Banking System ===");
        Random rand = new Random();
        
        // Create Accounts
        Account acc1 = new Account("Alice", 1000.0);
        Account acc2 = new Account("Bob", 500.0);

        // Simulate Transactions
        acc1.deposit(250.0);
        acc1.withdraw(100.0);
        
        acc2.withdraw(600.0); // Should fail
        acc2.deposit(rand.nextInt(500)); // Random deposit

        // Print Final Statements
        acc1.printStatement();
        acc2.printStatement();
    }
}
```
