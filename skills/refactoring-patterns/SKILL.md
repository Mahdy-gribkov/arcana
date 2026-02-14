---
name: refactoring-patterns
description: Code refactoring patterns with before/after diffs for extract method, extract class, inline, move, rename, dead code removal, dependency injection, and code smell detection.
---

## Extract Method

**When:** A code block does one logical thing within a function that does more.

**BEFORE:**

```typescript
function processOrder(order: Order) {
  // Validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (order.total <= 0) {
    throw new Error('Order total must be positive');
  }

  // Calculate tax
  let tax = 0;
  for (const item of order.items) {
    tax += item.price * item.quantity * 0.08;
  }

  // Save to database
  db.orders.insert({ ...order, tax });
}
```

**AFTER:**

```typescript
function processOrder(order: Order) {
  validateOrder(order);
  const tax = calculateTax(order.items);
  saveOrder(order, tax);
}

function validateOrder(order: Order) {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (order.total <= 0) {
    throw new Error('Order total must be positive');
  }
}

function calculateTax(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity * 0.08, 0);
}

function saveOrder(order: Order, tax: number) {
  db.orders.insert({ ...order, tax });
}
```

**Why:** Each function has a single responsibility. Method names replace comments.

## Extract Class

**When:** A class has multiple responsibilities or a group of fields are always used together.

**BEFORE:**

```typescript
class User {
  id: number;
  name: string;
  email: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;

  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.zipCode}, ${this.country}`;
  }

  updateAddress(street: string, city: string, zipCode: string, country: string) {
    this.street = street;
    this.city = city;
    this.zipCode = zipCode;
    this.country = country;
  }
}
```

**AFTER:**

```typescript
class Address {
  constructor(
    public street: string,
    public city: string,
    public zipCode: string,
    public country: string
  ) {}

  getFullAddress(): string {
    return `${this.street}, ${this.city}, ${this.zipCode}, ${this.country}`;
  }
}

class User {
  id: number;
  name: string;
  email: string;
  address: Address;

  updateAddress(address: Address) {
    this.address = address;
  }
}
```

**Why:** Address is a cohesive concept. Extracting it makes User simpler and Address reusable.

## Inline Method

**When:** A method's body is as clear as its name. The indirection adds no value.

**BEFORE:**

```typescript
function getDiscountedPrice(price: number, discount: number): number {
  return applyDiscount(price, discount);
}

function applyDiscount(price: number, discount: number): number {
  return price * (1 - discount);
}
```

**AFTER:**

```typescript
function getDiscountedPrice(price: number, discount: number): number {
  return price * (1 - discount);
}
```

**Why:** The method `applyDiscount` is called once and its body is obvious. Inlining simplifies.

## Inline Variable

**When:** A variable is used once and the expression is self-explanatory.

**BEFORE:**

```typescript
function isEligibleForDiscount(user: User): boolean {
  const hasPremiumAccount = user.accountType === 'premium';
  return hasPremiumAccount;
}
```

**AFTER:**

```typescript
function isEligibleForDiscount(user: User): boolean {
  return user.accountType === 'premium';
}
```

**Why:** The variable name does not add clarity. The expression is self-documenting.

## Move Method

**When:** A method uses data from another class more than its own class.

**BEFORE:**

```typescript
class Order {
  items: OrderItem[];
  customerId: number;

  calculateShipping(customer: Customer): number {
    if (customer.isPremium) {
      return 0;
    }
    return this.items.length * 5;
  }
}

class Customer {
  id: number;
  isPremium: boolean;
}
```

**AFTER:**

```typescript
class Order {
  items: OrderItem[];
  customerId: number;

  calculateShipping(customer: Customer): number {
    return customer.calculateShippingCost(this.items.length);
  }
}

class Customer {
  id: number;
  isPremium: boolean;

  calculateShippingCost(itemCount: number): number {
    if (this.isPremium) {
      return 0;
    }
    return itemCount * 5;
  }
}
```

**Why:** Shipping logic depends on customer data. Moving it to Customer class follows the data.

## Rename

**When:** The current name is misleading, abbreviated, or outdated.

**BEFORE:**

```typescript
function calc(x: number, y: number): number {
  return x * y * 0.08;
}

const res = calc(100, 2);
```

**AFTER:**

```typescript
function calculateSalesTax(price: number, quantity: number): number {
  return price * quantity * 0.08;
}

const salesTax = calculateSalesTax(100, 2);
```

**Why:** Descriptive names make intent clear. Abbreviations obscure meaning.

## Dead Code Elimination

**When:** Code is unreachable, unused, or commented out.

**BEFORE:**

```typescript
function processPayment(amount: number, method: string) {
  if (method === 'credit') {
    chargeCreditCard(amount);
  } else if (method === 'paypal') {
    chargePayPal(amount);
  }
  // else if (method === 'bitcoin') {
  //   chargeBitcoin(amount);
  // }
}

function chargeBitcoin(amount: number) {
  // No longer supported
}
```

**AFTER:**

```typescript
function processPayment(amount: number, method: string) {
  if (method === 'credit') {
    chargeCreditCard(amount);
  } else if (method === 'paypal') {
    chargePayPal(amount);
  }
}
```

**Why:** Dead code clutters the codebase. Version control preserves history.

## Dependency Injection

**When:** A class creates its dependencies internally. Hard to test and couples implementation.

**BEFORE:**

```typescript
class OrderService {
  private db = new Database();
  private emailer = new EmailService();

  async createOrder(order: Order) {
    await this.db.orders.insert(order);
    await this.emailer.send(order.email, 'Order confirmed');
  }
}
```

**AFTER:**

```typescript
class OrderService {
  constructor(
    private db: Database,
    private emailer: EmailService
  ) {}

  async createOrder(order: Order) {
    await this.db.orders.insert(order);
    await this.emailer.send(order.email, 'Order confirmed');
  }
}

// Usage
const db = new Database();
const emailer = new EmailService();
const orderService = new OrderService(db, emailer);

// Testing
const mockDb = new MockDatabase();
const mockEmailer = new MockEmailService();
const testService = new OrderService(mockDb, mockEmailer);
```

**Why:** Dependencies are explicit. Testing with mocks is trivial.

## Replace Conditional with Polymorphism

**When:** A switch or if/else chain selects behavior based on type.

**BEFORE:**

```typescript
class Order {
  type: 'standard' | 'express' | 'overnight';

  calculateShipping(): number {
    if (this.type === 'standard') {
      return 5;
    } else if (this.type === 'express') {
      return 15;
    } else if (this.type === 'overnight') {
      return 30;
    }
  }
}
```

**AFTER:**

```typescript
interface Order {
  calculateShipping(): number;
}

class StandardOrder implements Order {
  calculateShipping(): number {
    return 5;
  }
}

class ExpressOrder implements Order {
  calculateShipping(): number {
    return 15;
  }
}

class OvernightOrder implements Order {
  calculateShipping(): number {
    return 30;
  }
}
```

**Why:** Adding new order types requires no changes to existing code. Open/closed principle.

## Extract Variable

**When:** An expression is complex or used multiple times.

**BEFORE:**

```typescript
if (order.items.length > 10 && order.total > 1000 && order.customer.isPremium) {
  applyDiscount(order);
}
```

**AFTER:**

```typescript
const isLargeOrder = order.items.length > 10;
const isHighValue = order.total > 1000;
const isPremiumCustomer = order.customer.isPremium;

if (isLargeOrder && isHighValue && isPremiumCustomer) {
  applyDiscount(order);
}
```

**Why:** Named variables document intent. Complex conditions become readable.

## Code Smells

### Long Method

**Smell:** Method exceeds 20-30 lines.

**Fix:** Extract methods for logical blocks.

### Large Class

**Smell:** Class exceeds 200-300 lines or has multiple responsibilities.

**Fix:** Extract classes for cohesive groups of fields and methods.

### Feature Envy

**Smell:** A method uses another class's data more than its own.

**BEFORE:**

```typescript
class Report {
  generateSummary(user: User): string {
    return `${user.name} has ${user.orders.length} orders totaling $${user.getTotalSpent()}`;
  }
}
```

**AFTER:**

```typescript
class User {
  getSummary(): string {
    return `${this.name} has ${this.orders.length} orders totaling $${this.getTotalSpent()}`;
  }
}
```

### Data Clumps

**Smell:** Groups of variables appear together repeatedly.

**BEFORE:**

```typescript
function createUser(name: string, street: string, city: string, zipCode: string) {
  // ...
}

function updateUser(id: number, name: string, street: string, city: string, zipCode: string) {
  // ...
}
```

**AFTER:**

```typescript
interface Address {
  street: string;
  city: string;
  zipCode: string;
}

function createUser(name: string, address: Address) {
  // ...
}

function updateUser(id: number, name: string, address: Address) {
  // ...
}
```

### Primitive Obsession

**Smell:** Using strings or numbers where a domain type is clearer.

**BEFORE:**

```typescript
function sendEmail(email: string) {
  if (!email.includes('@')) {
    throw new Error('Invalid email');
  }
  // ...
}
```

**AFTER:**

```typescript
class Email {
  constructor(private value: string) {
    if (!value.includes('@')) {
      throw new Error('Invalid email');
    }
  }

  toString(): string {
    return this.value;
  }
}

function sendEmail(email: Email) {
  // Email is guaranteed valid
}
```

## Technical Debt Prioritization

### Scoring Formula

Score = (Frequency × Blast Radius) / Effort

- **Frequency:** How often is this code touched? (1-10)
- **Blast Radius:** How many users/features are affected if it breaks? (1-10)
- **Effort:** How long to fix? (1-10)

**Example:**

| Debt Item | Frequency | Blast Radius | Effort | Score |
|-----------|-----------|--------------|--------|-------|
| Refactor auth logic | 8 | 10 | 5 | 16 |
| Remove unused util | 1 | 1 | 1 | 1 |
| Split large class | 5 | 5 | 3 | 8.3 |

Fix highest-score items first.

## Refactoring Workflow

1. Write tests if none exist. Refactoring without tests is gambling.
2. Make one change per commit. Small commits are reviewable and revertable.
3. Run tests after every change. Failing tests mean behavior changed.
4. Use IDE refactoring tools. They are less error-prone than manual edits.
5. Review the diff before committing. Automated tools sometimes surprise.
6. Explain intent in pull request descriptions. Clarify why structure changed.
