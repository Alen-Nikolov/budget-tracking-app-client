export type Role = "USER" | "ADMIN";

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresInSeconds: number;
  refreshToken: string;
  userId: number;
  email: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  colour: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  amount: number;
  note: string | null;
  date: string;
  categoryId: number;
  categoryName: string;
  categoryColour: string;
}

export interface CategoryTotal {
  categoryId: number;
  categoryName: string;
  categoryColour: string;
  total: number;
}

export interface ExpenseSearch {
  from: string;
  to: string;
  total: number;
  byCategory: CategoryTotal[];
  expenses: Expense[];
}

export interface Stats {
  totalUsers: number;
  totalExpenses: number;
  totalAmount: number;
}

export interface ApiError {
  message?: string;
  fieldErrors?: Record<string, string> | null;
}
