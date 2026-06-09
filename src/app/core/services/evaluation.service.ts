import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompleteEvaluationRequest,
  CreateEvaluationRequest,
  EvaluationFilters,
  PropertyEvaluation,
} from '../models/property.model';
import { buildHttpParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getEvaluations(filters: EvaluationFilters = {}): Promise<PropertyEvaluation[]> {
    const params = buildHttpParams(filters);
    return firstValueFrom(this.http.get<PropertyEvaluation[]>(`${this.apiUrl}/evaluations`, { params }));
  }

  getEvaluation(id: number): Promise<PropertyEvaluation> {
    return firstValueFrom(this.http.get<PropertyEvaluation>(`${this.apiUrl}/evaluations/${id}`));
  }

  createEvaluation(request: CreateEvaluationRequest): Promise<PropertyEvaluation> {
    return firstValueFrom(this.http.post<PropertyEvaluation>(`${this.apiUrl}/evaluations`, request));
  }

  completeEvaluation(request: CompleteEvaluationRequest): Promise<PropertyEvaluation> {
    return firstValueFrom(this.http.patch<PropertyEvaluation>(`${this.apiUrl}/evaluations/${request.id}`, request));
  }
}
