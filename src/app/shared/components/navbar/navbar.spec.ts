import { ComponentFixture, TestBed } from '@angular/core/testing';
import { computed, signal } from '@angular/core';
import { provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { AuthService } from '../../../core/services/auth.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let currentUser: ReturnType<typeof signal>;
  let authService: { currentUser: ReturnType<typeof signal>; isAuthenticated: ReturnType<typeof computed>; logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    currentUser = signal(null);
    authService = {
      currentUser,
      isAuthenticated: computed(() => currentUser() !== null),
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
    currentUser.set({
      id: 12,
      email: 'alex@example.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      name: 'Alex Morgan',
      role: 'user',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(text).toContain('Alex Morgan');
    expect(text).toContain('Logout');
    expect(text).not.toContain('Sign In');
    expect(text).not.toContain('Register');
    expect(compiled.querySelector('.account-menu')).not.toBeNull();

    compiled.querySelector<HTMLButtonElement>('button.account-menu-item')?.click();

    expect(authService.logout).toHaveBeenCalled();
  });
});
