import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Register } from './register';
import { AuthService } from '../../../../core/services/auth.service';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authService: { register: ReturnType<typeof vi.fn> };
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    authService = {
      register: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        { provide: AuthService, useValue: authService },
        provideRouter([]),
      ],
    }).compileComponents();

    const router = TestBed.inject(Router);
    navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should submit a valid registration request', async () => {
    component['registerForm'].setValue({
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await component['submit']();

    expect(authService.register).toHaveBeenCalledWith({
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      password: 'password123',
    });
    expect(navigateByUrl).toHaveBeenCalledWith('/');
  });
});
