import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../models/user.model';
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
  isStaff = computed(() => {
    const role = this.currentUserSignal()?.role;

    return role === 'admin' || role === 'evaluator';
  });
  isLoading = this.isLoadingSignal.asReadonly();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  /**
   * Initialize auth by checking for stored token
   */
  private initializeAuth(): void {
    const token = this.getToken();
    if (!token) {
      this.currentUserSignal.set(null);
    }
  }

  /**
   * Load user from localStorage if exists
   */
  private loadUserFromStorage(): User | null {
    const token = localStorage.getItem(this.tokenKey);

    if (!token || this.isTokenExpired(token)) {
      this.clearStoredAuthData();
      return null;
    }

    const storedUser = localStorage.getItem('currentUser');

    if (!storedUser) {
      return null;
    }

    try {
      return this.normalizeStoredUser(JSON.parse(storedUser) as User);
    } catch {
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  /**
   * Login with email and password
   */
  async login(request: LoginRequest): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.apiUrl}/users/login`, request)
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
    this.clearStoredAuthData();
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);

    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
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
    const role = this.mapBackendRole(response.role);

    return {
      id: response.id,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      name: `${response.firstName} ${response.lastName}`.trim(),
      role,
      backendRole: response.role,
    };
  }

  private mapBackendRole(role: string | undefined): UserRole {
    const normalizedRole = role?.toLowerCase();

    if (normalizedRole === 'admin') {
      return 'admin';
    }

    if (normalizedRole === 'evaluator') {
      return 'evaluator';
    }

    return 'client';
  }

  private normalizeStoredUser(user: User): User {
    const role = this.mapBackendRole(user.backendRole ?? user.role);

    return {
      ...user,
      role,
      backendRole: user.backendRole ?? role,
    };
  }

  private clearStoredAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('currentUser');
  }

  private isTokenExpired(token: string): boolean {
    const payload = token.split('.')[1];

    if (!payload) {
      return true;
    }

    try {
      const decodedPayload = JSON.parse(atob(this.toBase64(payload))) as { exp?: number };

      return typeof decodedPayload.exp !== 'number' || Date.now() >= decodedPayload.exp * 1000;
    } catch {
      return true;
    }
  }

  private toBase64(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);

    return base64 + padding;
  }
}
