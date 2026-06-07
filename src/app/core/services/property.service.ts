import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePropertyRequest, PropertyFilters, PropertyRecord, PropertyValuation } from '../models/property.model';
import { buildHttpParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class PropertyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProperties(filters: PropertyFilters = {}): Promise<PropertyRecord[]> {
    const params = buildHttpParams(filters);
    return firstValueFrom(this.http.get<PropertyRecord[]>(`${this.apiUrl}/properties`, { params }));
  }

  getProperty(id: number): Promise<PropertyRecord> {
    return firstValueFrom(this.http.get<PropertyRecord>(`${this.apiUrl}/properties/${id}`));
  }

  getPropertyValuation(id: number): Promise<PropertyValuation> {
    return firstValueFrom(this.http.get<PropertyValuation>(`${this.apiUrl}/properties/${id}/valuation`));
  }

  createProperty(request: CreatePropertyRequest): Promise<PropertyRecord> {
    return firstValueFrom(this.http.post<PropertyRecord>(`${this.apiUrl}/properties`, request));
  }
}
