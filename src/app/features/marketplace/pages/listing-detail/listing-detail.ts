import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ListingStatus,
  PropertyListing,
  PropertyType,
  getListingStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ListingService } from '../../../../core/services/listing.service';
import { SavedPropertyService } from '../../../../core/services/saved-property.service';

@Component({
  selector: 'app-listing-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './listing-detail.html',
  styleUrl: './listing-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);
  private readonly savedPropertyService = inject(SavedPropertyService);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly listing = signal<PropertyListing | null>(null);
  protected readonly isSaved = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  constructor() {
    void this.loadListing();
  }

  protected getPropertyType(type: PropertyType): string {
    return getPropertyTypeLabel(type);
  }

  protected getListingStatus(status: ListingStatus): string {
    return getListingStatusLabel(status);
  }

  protected getPricePerSquareMeter(listing: PropertyListing): number {
    return Math.round(listing.askingPrice / Math.max(listing.property.area, 1));
  }

  protected toggleSaved(listing: PropertyListing): void {
    this.isSaved.set(this.savedPropertyService.toggleSaved(listing.id));
  }

  private async loadListing(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.loadError.set('The listing id is invalid.');
      this.isLoading.set(false);
      return;
    }

    try {
      const listing = await this.listingService.getListing(id);
      this.listing.set(listing);
      this.isSaved.set(this.savedPropertyService.isSaved(listing.id));
    } catch {
      this.loadError.set('Could not load this listing right now.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
