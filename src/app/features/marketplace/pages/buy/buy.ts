import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ListingStatus,
  PROPERTY_TYPE_OPTIONS,
  PropertyListing,
  PropertyType,
  getListingStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';

interface BuyFilters {
  city: string;
  propertyType: PropertyType | '';
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  minBathrooms: number | null;
}

@Component({
  selector: 'app-buy',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './buy.html',
  styleUrl: './buy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Buy {
  private readonly fb = inject(FormBuilder);
  private readonly listingService = inject(ListingService);

  protected readonly propertyTypes = PROPERTY_TYPE_OPTIONS;
  protected readonly listings = signal<PropertyListing[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly filterForm = this.fb.group({
    city: [''],
    propertyType: this.fb.control<PropertyType | ''>(''),
    minPrice: this.fb.control<number | null>(null),
    maxPrice: this.fb.control<number | null>(null),
    minBedrooms: this.fb.control<number | null>(null),
    minBathrooms: this.fb.control<number | null>(null),
  });

  private readonly activeFilters = signal<BuyFilters>(this.readFilters());

  protected readonly visibleListings = computed(() =>
    this.listings()
      .filter((listing) => this.matchesFilters(listing, this.activeFilters()))
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)),
  );

  constructor() {
    void this.loadListings();
  }

  protected applyFilters(): void {
    this.activeFilters.set(this.readFilters());
  }

  protected clearFilters(): void {
    this.filterForm.reset({
      city: '',
      propertyType: '',
      minPrice: null,
      maxPrice: null,
      minBedrooms: null,
      minBathrooms: null,
    });
    this.applyFilters();
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

  protected trackListing(_index: number, listing: PropertyListing): number {
    return listing.id;
  }

  private async loadListings(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const listings = await this.listingService.getAllListings({
        status: ListingStatus.Active,
      });
      this.listings.set(listings);
    } catch {
      this.loadError.set('Could not load listings right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private matchesFilters(listing: PropertyListing, filters: BuyFilters): boolean {
    const city = filters.city.trim().toLowerCase();
    const listingCity = listing.property.address.city.toLowerCase();

    return (
      (!city || listingCity.includes(city)) &&
      (filters.propertyType === '' || listing.property.propertyType === filters.propertyType) &&
      (filters.minPrice === null || listing.askingPrice >= filters.minPrice) &&
      (filters.maxPrice === null || listing.askingPrice <= filters.maxPrice) &&
      (filters.minBedrooms === null || listing.property.bedrooms >= filters.minBedrooms) &&
      (filters.minBathrooms === null || listing.property.bathrooms >= filters.minBathrooms)
    );
  }

  private readFilters(): BuyFilters {
    const filters = this.filterForm.getRawValue();

    return {
      city: filters.city ?? '',
      propertyType: filters.propertyType ?? '',
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minBedrooms: filters.minBedrooms,
      minBathrooms: filters.minBathrooms,
    };
  }
}
