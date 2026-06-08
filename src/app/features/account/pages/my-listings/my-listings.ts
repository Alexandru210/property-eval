import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ListingStatus,
  PropertyListing,
  getListingStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ListingService } from '../../../../core/services/listing.service';

@Component({
  selector: 'app-my-listings',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './my-listings.html',
  styleUrl: './my-listings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyListings {
  private readonly authService = inject(AuthService);
  private readonly listingService = inject(ListingService);

  protected readonly listings = signal<PropertyListing[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly stats = computed(() => {
    const listings = this.listings();

    return [
      { label: 'Active listings', value: String(listings.filter((listing) => listing.status === ListingStatus.Active).length) },
      { label: 'Inactive listings', value: String(listings.filter((listing) => listing.status === ListingStatus.Inactive).length) },
      { label: 'Sold listings', value: String(listings.filter((listing) => listing.status === ListingStatus.Sold).length) },
    ];
  });

  constructor() {
    void this.loadListings();
  }

  protected getListingStatus(status: ListingStatus): string {
    return getListingStatusLabel(status);
  }

  protected getPropertyType(listing: PropertyListing): string {
    return getPropertyTypeLabel(listing.property.propertyType);
  }

  protected trackListing(_index: number, listing: PropertyListing): number {
    return listing.id;
  }

  private async loadListings(): Promise<void> {
    const user = this.authService.currentUser();

    if (!user) {
      this.loadError.set('Sign in again to load your listings.');
      this.isLoading.set(false);
      return;
    }

    try {
      this.listings.set(await this.listingService.getAllListings({ userId: user.id }));
    } catch {
      this.loadError.set('Could not load your listings right now.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
