import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../models/user.model';

interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getEvaluators(): Promise<User[]> {
    return firstValueFrom(this.http.get<UserResponse[]>(`${this.apiUrl}/users/evaluators`))
      .then((users) => users.map((user) => this.mapUserResponse(user)));
  }

  private mapUserResponse(response: UserResponse): User {
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

  private mapBackendRole(role: string): UserRole {
    const normalizedRole = role.toLowerCase();

    if (normalizedRole === 'admin') {
      return 'admin';
    }

    if (normalizedRole === 'evaluator') {
      return 'evaluator';
    }

    return 'client';
  }
}
