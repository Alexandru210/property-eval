import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ListingStatus,
  PropertyImage,
  PropertyListing,
  PropertyType,
  getListingStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { AuthService } from '../../../../core/services/auth.service';
import { resolveApiImageUrl } from '../../../../core/services/image-url';
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
  protected readonly selectedPhotoIndex = signal<number | null>(null);

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

  protected getImageUrl(imageUrl: string): string {
    return resolveApiImageUrl(imageUrl);
  }

  protected getPrimaryImageUrl(listing: PropertyListing): string | null {
    const imageUrl = listing.property.images[0]?.imageUrl;

    return imageUrl ? this.getImageUrl(imageUrl) : null;
  }

  protected openPhoto(index: number): void {
    const listing = this.listing();

    if (!listing || !listing.property.images[index]) {
      return;
    }

    this.selectedPhotoIndex.set(index);
  }

  protected closePhoto(): void {
    this.selectedPhotoIndex.set(null);
  }

  protected getSelectedPhoto(listing: PropertyListing): PropertyImage | null {
    const index = this.selectedPhotoIndex();

    return index === null ? null : listing.property.images[index] ?? null;
  }

  protected showPreviousPhoto(listing: PropertyListing): void {
    this.moveSelectedPhoto(listing, -1);
  }

  protected showNextPhoto(listing: PropertyListing): void {
    this.moveSelectedPhoto(listing, 1);
  }

  protected toggleSaved(listing: PropertyListing): void {
    this.isSaved.set(this.savedPropertyService.toggleSaved(listing.id));
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    this.closePhoto();
  }

  @HostListener('document:keydown.arrowleft')
  protected handleArrowLeft(): void {
    const listing = this.listing();

    if (listing && this.selectedPhotoIndex() !== null) {
      this.showPreviousPhoto(listing);
    }
  }

  @HostListener('document:keydown.arrowright')
  protected handleArrowRight(): void {
    const listing = this.listing();

    if (listing && this.selectedPhotoIndex() !== null) {
      this.showNextPhoto(listing);
    }
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

  private moveSelectedPhoto(listing: PropertyListing, offset: number): void {
    const currentIndex = this.selectedPhotoIndex();
    const photoCount = listing.property.images.length;

    if (currentIndex === null || photoCount < 2) {
      return;
    }

    this.selectedPhotoIndex.set((currentIndex + offset + photoCount) % photoCount);
  }
}
