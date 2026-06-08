import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ListingStatus, PropertyListing, PropertyType } from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';
import { SavedPropertyService } from '../../../../core/services/saved-property.service';

import { SavedProperties } from './saved-properties';

describe('SavedProperties', () => {
  let component: SavedProperties;
  let fixture: ComponentFixture<SavedProperties>;
  let listingService: { getListing: ReturnType<typeof vi.fn> };
  let savedPropertyService: {
    getSavedListingIds: ReturnType<typeof vi.fn>;
    removeSaved: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    listingService = {
      getListing: vi.fn().mockResolvedValue(createListing(1)),
    };
    savedPropertyService = {
      getSavedListingIds: vi.fn().mockReturnValue([]),
      removeSaved: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SavedProperties],
      providers: [
        provideRouter([]),
        { provide: ListingService, useValue: listingService },
        { provide: SavedPropertyService, useValue: savedPropertyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedProperties);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load saved listings by id', async () => {
    savedPropertyService.getSavedListingIds.mockReturnValue([1]);

    fixture = TestBed.createComponent(SavedProperties);
    component = fixture.componentInstance;
    await fixture.whenStable();

    expect(listingService.getListing).toHaveBeenCalledWith(1);
    expect(component['listings']().length).toBe(1);
  });
});

function createListing(id: number): PropertyListing {
  return {
    id,
    propertyId: id,
    userId: 1,
    userFullName: 'Alex Morgan',
    title: `Listing ${id}`,
    askingPrice: 150000,
    status: ListingStatus.Active,
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
    property: {
      id,
      address: {
        id,
        street: 'Main Street',
        city: 'Cluj-Napoca',
        county: 'Cluj',
      },
      propertyType: PropertyType.Apartment,
      area: 80,
      bedrooms: 2,
      bathrooms: 1,
      yearBuilt: 2020,
      description: 'Test property',
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: null,
    },
  };
}
