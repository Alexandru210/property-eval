import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('should attach bearer tokens to protected requests', () => {
    const request = new HttpRequest('GET', 'https://localhost:7099/listings');
    let forwardedRequest: HttpRequest<unknown> | undefined;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { getToken: () => 'jwt-token' },
        },
      ],
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, (nextRequest) => {
        forwardedRequest = nextRequest;
        return of();
      });
    });

    expect(forwardedRequest).toBeDefined();
    expect((forwardedRequest as HttpRequest<unknown>).headers.get('Authorization')).toBe('Bearer jwt-token');
  });

  it('should not attach bearer tokens to login requests', () => {
    const request = new HttpRequest('POST', 'https://localhost:7099/users/login', {});
    let forwardedRequest: HttpRequest<unknown> | undefined;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { getToken: () => 'jwt-token' },
        },
      ],
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, (nextRequest) => {
        forwardedRequest = nextRequest;
        return of();
      });
    });

    expect(forwardedRequest).toBeDefined();
    expect((forwardedRequest as HttpRequest<unknown>).headers.has('Authorization')).toBe(false);
  });
});
