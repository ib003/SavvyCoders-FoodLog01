// server/src/authStorage.ts
export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

const usersByEmail = new Map<string, User>();

export function getUserByEmail(email: string): User | undefined {
  return usersByEmail.get(email.toLowerCase());
}

export function saveUser(user: User): void {
  usersByEmail.set(user.email.toLowerCase(), user);
}