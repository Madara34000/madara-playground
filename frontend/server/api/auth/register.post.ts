import { randomUUID, createHash } from "node:crypto";

// Simple in-memory store (shared - in production use a real DB)
const users = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, email, password } = body;

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, message: "Name, email and password required" });
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: "Password must be at least 8 characters" });
  }

  if (users.has(email)) {
    throw createError({ statusCode: 409, message: "Email already registered" });
  }

  const id = randomUUID();
  users.set(email, { id, name, email, passwordHash: hashPassword(password) });

  const token = randomUUID();

  return {
    user: { id, name, email },
    token,
  };
});
