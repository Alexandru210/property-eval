import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateListingRequest, ListingFilters, PropertyListing } from '../models/property.model';
import { buildHttpParams } from './query-params';

@Injectable({ providedIn: 'root' })
export class ListingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getListings(filters: ListingFilters = {}): Promise<PropertyListing[]> {
    const params = buildHttpParams(filters);
    return firstValueFrom(this.http.get<PropertyListing[]>(`${this.apiUrl}/listings`, { params }));
  }

  getListing(id: number): Promise<PropertyListing> {
    return firstValueFrom(this.http.get<PropertyListing>(`${this.apiUrl}/listings/${id}`));
  }

  async getAllListings(filters: ListingFilters = {}, pageSize = 100): Promise<PropertyListing[]> {
    const listingsById = new Map<number, PropertyListing>();
    const maxPages = 50;

    for (let page = 1; page <= maxPages; page++) {
      const pageListings = await this.getListings({ ...filters, page, pageSize });
      const previousCount = listingsById.size;

      for (const listing of pageListings) {
        listingsById.set(listing.id, listing);
      }

      if (pageListings.length < pageSize || listingsById.size === previousCount) {
        break;
      }
    }

    return Array.from(listingsById.values());
  }

  createListing(request: CreateListingRequest): Promise<PropertyListing> {
    return firstValueFrom(this.http.post<PropertyListing>(`${this.apiUrl}/listings`, request));
  }
}
