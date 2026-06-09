import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let currentUser: ReturnType<typeof signal<User | null>>;
  let authService: {
    currentUser: ReturnType<typeof signal<User | null>>;
    isAuthenticated: ReturnType<typeof computed>;
    isStaff: ReturnType<typeof computed>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    currentUser = signal<User | null>(null);
    authService = {
      currentUser,
      isAuthenticated: computed(() => currentUser() !== null),
      isStaff: computed(() => {
        const role = currentUser()?.role;

        return role === 'admin' || role === 'evaluator';
      }),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the MVP navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const linkTexts = Array.from(compiled.querySelectorAll('a')).map((link) =>
      link.textContent?.trim()
    );

    expect(linkTexts).toEqual(['Buy', 'Sell', 'Evaluate', 'Property Eval', 'Sign In', 'Register']);
  });

  it('should show the current user menu and hide auth links when authenticated', () => {
    currentUser.set(createUser('client'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(text).toContain('Alex Morgan');
    expect(text).toContain('My Listings');
    expect(text).toContain('Saved Properties');
    expect(text).toContain('My Evaluations');
    expect(text).not.toContain('Evaluation Workbench');
    expect(text).toContain('Logout');
    expect(text).not.toContain('Sign In');
    expect(text).not.toContain('Register');
    expect(compiled.querySelector('.account-menu')).not.toBeNull();
    expect(compiled.querySelector('a[routerLink="/my-listings"]')).not.toBeNull();
    expect(compiled.querySelector('a[routerLink="/saved-properties"]')).not.toBeNull();
    expect(compiled.querySelector('a[routerLink="/my-evaluations"]')).not.toBeNull();

    compiled.querySelector<HTMLButtonElement>('button.account-menu-item')?.click();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should show the evaluation workbench link for staff users', () => {
    currentUser.set(createUser('evaluator'));
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(text).toContain('Evaluation Workbench');
    expect(compiled.querySelector('a[routerLink="/evaluation-workbench"]')).not.toBeNull();
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
