import { createHash, randomUUID } from "node:crypto";

// Simple in-memory store (replace with a real database in production)
const users = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, password } = body;

  if (!email || !password) {
    throw createError({ statusCode: 400, message: "Email and password required" });
  }

  const user = users.get(email);

  if (!user || user.passwordHash !== hashPassword(password)) {
    throw createError({ statusCode: 401, message: "Invalid email or password" });
  }

  const token = randomUUID();

  return {
    user: { id: user.id, name: user.name, email: user.email },
    token,
  };
});

// Export for use in register
export { users, hashPassword };
