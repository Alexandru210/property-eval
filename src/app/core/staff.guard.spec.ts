import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { User } from './models/user.model';
import { AuthService } from './services/auth.service';
import { staffGuard } from './staff.guard';

describe('staffGuard', () => {
  let currentUser: ReturnType<typeof signal<User | null>>;

  beforeEach(() => {
    currentUser = signal<User | null>(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser,
            isAuthenticated: computed(() => currentUser() !== null),
            isStaff: computed(() => {
              const role = currentUser()?.role;

              return role === 'admin' || role === 'evaluator';
            }),
          },
        },
      ],
    });
  });

  it('should allow admins', () => {
    currentUser.set(createUser('admin'));

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as never, { url: '/evaluation-workbench' } as never),
    );

    expect(result).toBe(true);
  });

  it('should allow evaluators', () => {
    currentUser.set(createUser('evaluator'));

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as never, { url: '/evaluation-workbench' } as never),
    );

    expect(result).toBe(true);
  });

  it('should redirect clients to their evaluations', () => {
    currentUser.set(createUser('client'));
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as never, { url: '/evaluation-workbench' } as never),
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/my-evaluations');
  });

  it('should redirect guests to login with returnUrl', () => {
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() =>
      staffGuard({} as never, { url: '/evaluation-workbench' } as never),
    ) as UrlTree;

    expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fevaluation-workbench');
  });
});

function createUser(role: User['role']): User {
  return {
    id: 12,
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: 'Morgan',
    name: 'Alex Morgan',
    role,
    backendRole: role,
  };
}
