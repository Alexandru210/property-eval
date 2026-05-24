export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
