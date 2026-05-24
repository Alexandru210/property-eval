import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'auth_token';

  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());
  private isLoadingSignal = signal(false);

  // Computed signals for easy access
  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);
  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  isLoading = this.isLoadingSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Initialize auth by checking for stored token
   */
  private initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      // Token exists, but user might be stale. In real app, validate with backend.
      // For MVP, assume token is valid if present.
    }
  }

  /**
   * Load user from localStorage if exists
   */
  private loadUserFromStorage(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/login`, request)
      );
      this.setAuthData(response);
    } catch (error) {
      this.currentUserSignal.set(null);
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Register a new user
   */
  async register(request: RegisterRequest): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/users`, request)
      );
      this.setAuthData(response);
    } catch (error) {
      this.currentUserSignal.set(null);
      throw error;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Logout and clear auth data
   */
  logout(): void {
    this.currentUserSignal.set(null);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('currentUser');
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set auth data (token + user) and store in localStorage
   */
  private setAuthData(response: AuthResponse): void {
    const user = this.mapAuthResponseToUser(response);

    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSignal.set(user);
  }

  private mapAuthResponseToUser(response: AuthResponse): User {
    return {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      name: `${response.firstName} ${response.lastName}`.trim(),
      role: 'user',
    };
  }
}
