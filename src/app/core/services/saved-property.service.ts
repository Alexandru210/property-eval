import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SavedPropertyService {
  private readonly authService = inject(AuthService);
  private readonly storageKeyPrefix = 'saved_property_listing_ids';

  getSavedListingIds(): number[] {
    const storageKey = this.getStorageKey();

    if (!storageKey) {
      return [];
    }

    const storedValue = localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    try {
      const listingIds = JSON.parse(storedValue) as unknown;

      if (!Array.isArray(listingIds)) {
        return [];
      }

      return Array.from(
        new Set(
          listingIds.filter(
            (listingId): listingId is number => Number.isInteger(listingId) && listingId > 0,
          ),
        ),
      );
    } catch {
      localStorage.removeItem(storageKey);
      return [];
    }
  }

  isSaved(listingId: number): boolean {
    return this.getSavedListingIds().includes(listingId);
  }

  toggleSaved(listingId: number): boolean {
    const listingIds = this.getSavedListingIds();

    if (listingIds.includes(listingId)) {
      this.setSavedListingIds(listingIds.filter((savedListingId) => savedListingId !== listingId));
      return false;
    }

    this.setSavedListingIds([listingId, ...listingIds]);
    return true;
  }

  removeSaved(listingId: number): void {
    this.setSavedListingIds(
      this.getSavedListingIds().filter((savedListingId) => savedListingId !== listingId),
    );
  }

  private setSavedListingIds(listingIds: number[]): void {
    const storageKey = this.getStorageKey();

    if (!storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(listingIds));
  }

  private getStorageKey(): string | null {
    const user = this.authService.currentUser();

    return user ? `${this.storageKeyPrefix}:${user.id}` : null;
  }
}
