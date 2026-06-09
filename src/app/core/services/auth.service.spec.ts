import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/user.model';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let http: { post: ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    http = {
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should login, store auth data, and expose staff status for evaluators', async () => {
    const request: LoginRequest = {
      email: 'eva@example.com',
      password: 'password123',
    };
    const response = createAuthResponse('Evaluator');
    http.post.mockReturnValue(of(response));

    await service.login(request);

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}/users/login`, request);
    expect(localStorage.getItem('auth_token')).toBe(response.token);
    expect(service.currentUser()).toEqual({
      id: 7,
      email: 'eva@example.com',
      firstName: 'Eva',
      lastName: 'Stone',
      name: 'Eva Stone',
      role: 'evaluator',
      backendRole: 'Evaluator',
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isStaff()).toBe(true);
    expect(service.isAdmin()).toBe(false);
    expect(service.isLoading()).toBe(false);
  });

  it('should register through the users endpoint and map admin role', async () => {
    const request: RegisterRequest = {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      password: 'password123',
    };
    http.post.mockReturnValue(of(createAuthResponse('Admin')));

    await service.register(request);

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}/users`, request);
    expect(service.currentUser()?.role).toBe('admin');
    expect(service.isAdmin()).toBe(true);
  });

  it('should clear the current user and rethrow when login fails', async () => {
    localStorage.setItem('auth_token', createToken(60 * 60));
    localStorage.setItem('currentUser', JSON.stringify({ id: 1 }));
    http.post.mockReturnValue(throwError(() => new Error('Invalid credentials')));

    await expect(service.login({ email: 'alex@example.com', password: 'wrong' })).rejects.toThrow(
      'Invalid credentials',
    );

    expect(service.currentUser()).toBeNull();
    expect(service.isLoading()).toBe(false);
  });

  it('should load and normalize a stored user with a valid token', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('auth_token', createToken(60 * 60));
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 9,
        email: 'admin@example.com',
        firstName: 'Ada',
        lastName: 'Admin',
        name: 'Ada Admin',
        role: 'Admin',
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: http },
      ],
    });

    const storedService = TestBed.inject(AuthService);

    expect(storedService.currentUser()?.role).toBe('admin');
    expect(storedService.currentUser()?.backendRole).toBe('admin');
  });

  it('should remove expired tokens when reading the token', () => {
    localStorage.setItem('auth_token', createToken(-60));
    localStorage.setItem('currentUser', JSON.stringify({ id: 7 }));

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });
});

function createAuthResponse(role: string): AuthResponse {
  return {
    id: 7,
    firstName: 'Eva',
    lastName: 'Stone',
    email: 'eva@example.com',
    role,
    token: createToken(60 * 60),
  };
}

function createToken(offsetSeconds: number): string {
  const exp = Math.floor(Date.now() / 1000) + offsetSeconds;
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return `header.${payload}.signature`;
}
