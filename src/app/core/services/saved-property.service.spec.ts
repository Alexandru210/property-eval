import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { SavedPropertyService } from './saved-property.service';

describe('SavedPropertyService', () => {
  let currentUser: ReturnType<typeof signal<User | null>>;
  let service: SavedPropertyService;

  beforeEach(() => {
    localStorage.clear();
    currentUser = signal<User | null>(createUser(7));

    TestBed.configureTestingModule({
      providers: [
        SavedPropertyService,
        {
          provide: AuthService,
          useValue: { currentUser },
        },
      ],
    });

    service = TestBed.inject(SavedPropertyService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should return no saved listings when there is no authenticated user', () => {
    currentUser.set(null);

    expect(service.getSavedListingIds()).toEqual([]);
    expect(service.toggleSaved(4)).toBe(true);
    expect(localStorage.length).toBe(0);
  });

  it('should read only positive integer listing ids and remove duplicates', () => {
    localStorage.setItem(storageKey(7), JSON.stringify([5, '6', -1, 5, 2, 0, 2]));

    expect(service.getSavedListingIds()).toEqual([5, 2]);
  });

  it('should save new ids first and remove existing ids when toggled again', () => {
    localStorage.setItem(storageKey(7), JSON.stringify([5, 2]));

    expect(service.toggleSaved(9)).toBe(true);
    expect(service.getSavedListingIds()).toEqual([9, 5, 2]);

    expect(service.toggleSaved(5)).toBe(false);
    expect(service.getSavedListingIds()).toEqual([9, 2]);
  });

  it('should check and remove saved listing ids', () => {
    localStorage.setItem(storageKey(7), JSON.stringify([3, 4]));

    expect(service.isSaved(4)).toBe(true);

    service.removeSaved(4);

    expect(service.isSaved(4)).toBe(false);
    expect(service.getSavedListingIds()).toEqual([3]);
  });

  it('should clear malformed saved data for the current user', () => {
    localStorage.setItem(storageKey(7), '{bad json');

    expect(service.getSavedListingIds()).toEqual([]);
    expect(localStorage.getItem(storageKey(7))).toBeNull();
  });
});

function createUser(id: number): User {
  return {
    id,
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: 'Morgan',
    name: 'Alex Morgan',
    role: 'client',
    backendRole: 'client',
  };
}

function storageKey(userId: number): string {
  return `saved_property_listing_ids:${userId}`;
}
