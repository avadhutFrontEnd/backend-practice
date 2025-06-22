export interface User {
  id: string;
  name: string;
  email: string;
}

export const users: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];
