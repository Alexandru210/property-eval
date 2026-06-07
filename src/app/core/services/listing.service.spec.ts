import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ListingStatus, PropertyListing, PropertyType } from '../models/property.model';
import { ListingService } from './listing.service';

describe('ListingService', () => {
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let service: ListingService;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ListingService,
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(ListingService);
  });

  it('should collect paged listing results without dropping later pages', async () => {
    http.get
      .mockReturnValueOnce(of([createListing(1), createListing(2)]))
      .mockReturnValueOnce(of([createListing(3)]));

    const listings = await service.getAllListings({ status: ListingStatus.Active }, 2);

    expect(listings.map((listing) => listing.id)).toEqual([1, 2, 3]);
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});

function createListing(id: number): PropertyListing {
  return {
    id,
    propertyId: id,
    userId: 1,
    userFullName: 'Alex Morgan',
    title: `Listing ${id}`,
    askingPrice: 100000 + id,
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
      area: 50,
      bedrooms: 1,
      bathrooms: 1,
      yearBuilt: 2020,
      description: 'Test property',
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: null,
    },
  };
}
