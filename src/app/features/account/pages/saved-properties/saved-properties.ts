import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ListingStatus,
  PropertyListing,
  getListingStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';
import { SavedPropertyService } from '../../../../core/services/saved-property.service';

@Component({
  selector: 'app-saved-properties',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './saved-properties.html',
  styleUrl: './saved-properties.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedProperties {
  private readonly listingService = inject(ListingService);
  private readonly savedPropertyService = inject(SavedPropertyService);

  protected readonly listings = signal<PropertyListing[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly unavailableCount = signal(0);

  protected readonly stats = computed(() => {
    const listings = this.listings();

    return [
      { label: 'Saved homes', value: String(listings.length) },
      { label: 'Active listings', value: String(listings.filter((listing) => listing.status === ListingStatus.Active).length) },
      { label: 'Unavailable', value: String(this.unavailableCount()) },
    ];
  });

  constructor() {
    void this.loadSavedProperties();
  }

  protected getListingStatus(status: ListingStatus): string {
    return getListingStatusLabel(status);
  }

  protected getPropertyType(listing: PropertyListing): string {
    return getPropertyTypeLabel(listing.property.propertyType);
  }

  protected getPricePerSquareMeter(listing: PropertyListing): number {
    return Math.round(listing.askingPrice / Math.max(listing.property.area, 1));
  }

  protected removeSaved(listing: PropertyListing): void {
    this.savedPropertyService.removeSaved(listing.id);
    this.listings.update((listings) => listings.filter((savedListing) => savedListing.id !== listing.id));
  }

  protected trackListing(_index: number, listing: PropertyListing): number {
    return listing.id;
  }

  private async loadSavedProperties(): Promise<void> {
    const savedListingIds = this.savedPropertyService.getSavedListingIds();

    if (savedListingIds.length === 0) {
      this.isLoading.set(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        savedListingIds.map((listingId) => this.listingService.getListing(listingId)),
      );
      const listings = results
        .filter((result): result is PromiseFulfilledResult<PropertyListing> => result.status === 'fulfilled')
        .map((result) => result.value)
        .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
      const unavailableListingIds = savedListingIds.filter((_, index) => results[index].status === 'rejected');

      for (const listingId of unavailableListingIds) {
        this.savedPropertyService.removeSaved(listingId);
      }

      this.listings.set(listings);
      this.unavailableCount.set(unavailableListingIds.length);
    } catch {
      this.loadError.set('Could not load saved properties right now.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
