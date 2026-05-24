import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Login } from './login';
import { AuthService } from '../../../../core/services/auth.service';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: { login: ReturnType<typeof vi.fn> };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authService = {
      login: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit a valid login request', async () => {
    component['loginForm'].setValue({
      email: 'alex@example.com',
      password: 'password123',
    });

    await component['submit']();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'password123',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });
});
