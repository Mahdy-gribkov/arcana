---
name: typescript
description: TypeScript patterns covering strict types, generics constraints, utility types (Pick, Omit, Record, Extract), discriminated unions, async patterns, and common mistakes with BAD/GOOD comparisons.
---

## Types and Type Safety

**BAD:** Using `any` defeats the type system.

```typescript
function processData(data: any) {
  return data.value.toUpperCase();
}
```

**GOOD:** Define explicit types or use generics.

```typescript
interface DataWithValue {
  value: string;
}

function processData(data: DataWithValue): string {
  return data.value.toUpperCase();
}
```

### When TypeScript Can Infer

**BAD:** Redundant type annotations.

```typescript
const count: number = 42;
const name: string = 'Alice';
```

**GOOD:** Let TypeScript infer.

```typescript
const count = 42;       // inferred as number
const name = 'Alice';   // inferred as string
```

### When to Annotate

**GOOD:** Annotate when inference is insufficient or incorrect.

```typescript
const data = JSON.parse(response);  // inferred as any

const data: User = JSON.parse(response);  // explicitly typed
```

### Record vs Object

**BAD:** Using `object` or `{}`. These allow any object.

```typescript
function logData(data: object) {
  console.log(data);
}
```

**GOOD:** Use `Record<PropertyKey, unknown>` for arbitrary objects.

```typescript
function logData(data: Record<PropertyKey, unknown>) {
  console.log(data);
}
```

## Interfaces vs Types

**GOOD:** Use `interface` for object shapes. Use `type` for unions, intersections, and primitives.

```typescript
// Object shapes: interface
interface User {
  id: number;
  name: string;
}

// Unions: type
type Status = 'pending' | 'approved' | 'rejected';

// Intersections: type
type AdminUser = User & { role: 'admin' };
```

### Extending Interfaces

Interfaces can be extended and merged.

```typescript
interface User {
  id: number;
  name: string;
}

interface User {
  email: string;  // Declaration merging
}

interface Admin extends User {
  role: 'admin';
}
```

## Generics Constraints

**BAD:** Unconstrained generics allow any type.

```typescript
function getProperty<T>(obj: T, key: string) {
  return obj[key];  // Error: key is not guaranteed to exist on T
}
```

**GOOD:** Constrain generics with `extends`.

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: 'Alice' };
const name = getProperty(user, 'name');  // Type: string
const invalid = getProperty(user, 'age');  // Error: 'age' does not exist
```

### Multiple Constraints

Combine constraints for precise types.

```typescript
interface Identifiable {
  id: number;
}

interface Named {
  name: string;
}

function findById<T extends Identifiable & Named>(
  items: T[],
  id: number
): T | undefined {
  return items.find(item => item.id === id);
}
```

### Default Generic Types

Provide fallback types for flexibility.

```typescript
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

const strings = createArray(3, 'hello');  // T inferred as string
const numbers = createArray<number>(3, 42);  // T explicitly number
const defaults = createArray(3, 'default');  // T uses default (string)
```

## Utility Types

### Pick: Select Subset of Properties

**BAD:** Manually redefining subsets.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface PublicUser {
  id: number;
  name: string;
  email: string;
}
```

**GOOD:** Use `Pick` to extract properties.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type PublicUser = Pick<User, 'id' | 'name' | 'email'>;
```

### Omit: Exclude Properties

```typescript
type UserWithoutPassword = Omit<User, 'password'>;
```

### Partial: Make All Properties Optional

**BAD:** Manually creating optional types.

```typescript
interface UpdateUserInput {
  id?: number;
  name?: string;
  email?: string;
}
```

**GOOD:** Use `Partial`.

```typescript
function updateUser(id: number, updates: Partial<User>) {
  // All User properties are optional in updates
}
```

### Required: Make All Properties Required

Inverse of `Partial`.

```typescript
interface Config {
  apiKey?: string;
  timeout?: number;
}

type RequiredConfig = Required<Config>;  // All fields required
```

### Record: Map Keys to Values

**BAD:** Using index signatures.

```typescript
interface StatusMap {
  [key: string]: string;
}
```

**GOOD:** Use `Record` for type-safe key-value maps.

```typescript
type Status = 'pending' | 'approved' | 'rejected';
type StatusMessages = Record<Status, string>;

const messages: StatusMessages = {
  pending: 'Awaiting review',
  approved: 'Request approved',
  rejected: 'Request denied',
};
```

### Extract: Filter Union Types

Extract types from a union that match a condition.

```typescript
type Shape = 'circle' | 'square' | 'triangle' | 'rectangle';
type RoundShapes = Extract<Shape, 'circle'>;  // 'circle'

type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string }
  | { type: 'focus' };

type ClickEvent = Extract<Event, { type: 'click' }>;
```

### Exclude: Remove Types from Union

```typescript
type Shape = 'circle' | 'square' | 'triangle' | 'rectangle';
type AngularShapes = Exclude<Shape, 'circle'>;  // 'square' | 'triangle' | 'rectangle'
```

### ReturnType: Extract Function Return Type

```typescript
function getUser() {
  return { id: 1, name: 'Alice' };
}

type User = ReturnType<typeof getUser>;  // { id: number; name: string }
```

## Discriminated Unions

**BAD:** Unions without discriminator. TypeScript cannot narrow types.

```typescript
type Result = { data: string } | { error: Error };

function handleResult(result: Result) {
  if (result.data) {  // Error: 'data' may not exist
    console.log(result.data);
  }
}
```

**GOOD:** Add a discriminator property.

```typescript
type Success = { status: 'success'; data: string };
type Failure = { status: 'error'; error: Error };
type Result = Success | Failure;

function handleResult(result: Result) {
  if (result.status === 'success') {
    console.log(result.data);  // TypeScript knows this is Success
  } else {
    console.error(result.error);  // TypeScript knows this is Failure
  }
}
```

### Exhaustive Checks

Ensure all union cases are handled.

```typescript
type Status = 'pending' | 'approved' | 'rejected';

function handleStatus(status: Status): string {
  switch (status) {
    case 'pending':
      return 'Awaiting review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      const _exhaustive: never = status;  // Error if a case is missing
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
}
```

## Async Patterns

**BAD:** Using callbacks. Hard to read and error-prone.

```typescript
function fetchUser(id: number, callback: (user: User) => void) {
  fetch(`/api/users/${id}`)
    .then(res => res.json())
    .then(user => callback(user));
}
```

**GOOD:** Use `async`/`await`.

```typescript
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return res.json();
}
```

### Promise.all for Concurrency

**BAD:** Sequential awaits. Slow when requests are independent.

```typescript
const user = await fetchUser(1);
const posts = await fetchPosts(1);
const comments = await fetchComments(1);
```

**GOOD:** Parallel requests with `Promise.all`.

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(1),
  fetchPosts(1),
  fetchComments(1),
]);
```

### Error Handling

**BAD:** Unhandled promise rejection.

```typescript
async function loadData() {
  const data = await fetch('/api/data');
  return data.json();
}
```

**GOOD:** Wrap in try/catch.

```typescript
async function loadData() {
  try {
    const data = await fetch('/api/data');
    return data.json();
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}
```

## Common Mistakes

### Magic Values

**BAD:** Hardcoded strings and numbers.

```typescript
if (user.status === 'approved') {
  sendEmail(user.email, 'Your request was approved');
}
```

**GOOD:** Use named constants.

```typescript
const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

const APPROVAL_EMAIL_SUBJECT = 'Your request was approved';

if (user.status === USER_STATUS.APPROVED) {
  sendEmail(user.email, APPROVAL_EMAIL_SUBJECT);
}
```

### Optional Chaining vs Nullish Coalescing

**BAD:** Using `||` for defaults. Fails for falsy values like `0` or `''`.

```typescript
const count = user.count || 10;  // If count is 0, uses 10
```

**GOOD:** Use `??` for nullish coalescing.

```typescript
const count = user.count ?? 10;  // Only uses 10 if count is null/undefined
```

### Type Assertions

**BAD:** Using `as any` to bypass type checking.

```typescript
const data = JSON.parse(response) as any;
```

**GOOD:** Use `@ts-expect-error` for known issues. Forces re-evaluation when fixed.

```typescript
// @ts-expect-error - API returns string, but type expects number. Fix pending.
const id: number = data.id;
```

### Object Destructuring

**BAD:** Verbose property access.

```typescript
function displayUser(user: User) {
  console.log(`${user.name} (${user.email})`);
}
```

**GOOD:** Destructure for clarity.

```typescript
function displayUser({ name, email }: User) {
  console.log(`${name} (${email})`);
}
```

## Performance

### Prefer for...of

**BAD:** Index-based loops.

```typescript
for (let i = 0; i < users.length; i++) {
  console.log(users[i].name);
}
```

**GOOD:** Use `for...of`.

```typescript
for (const user of users) {
  console.log(user.name);
}
```

### Avoid *Sync APIs

**BAD:** Blocking synchronous file reads.

```typescript
import { readFileSync } from 'fs';
const data = readFileSync('file.txt', 'utf-8');
```

**GOOD:** Use async APIs.

```typescript
import { readFile } from 'fs/promises';
const data = await readFile('file.txt', 'utf-8');
```

## Logging

**BAD:** Logging private information.

```typescript
console.log('User API key:', user.apiKey);
```

**GOOD:** Redact sensitive fields.

```typescript
console.log('User:', { ...user, apiKey: '[REDACTED]' });
```

## Time Consistency

**BAD:** Calling `Date.now()` multiple times. Values may differ.

```typescript
const startTime = Date.now();
// ... some logic
const endTime = Date.now();
const anotherTime = Date.now();
```

**GOOD:** Assign once and reuse.

```typescript
const now = Date.now();
const startTime = now;
const endTime = now + duration;
```
