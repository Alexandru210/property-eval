import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ListingStatus, PropertyListing, PropertyType } from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';
import { Buy } from './buy';

describe('Buy', () => {
  let component: Buy;
  let fixture: ComponentFixture<Buy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Buy],
      providers: [
        provideRouter([]),
        {
          provide: ListingService,
          useValue: {
            getAllListings: vi.fn().mockResolvedValue([
              createListing(1, 'Cluj-Napoca', PropertyType.Apartment, 150000),
              createListing(2, 'Brasov', PropertyType.House, 250000, '2026-06-03T00:00:00Z'),
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Buy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter listings by city and price', () => {
    component['filterForm'].patchValue({
      city: 'cluj',
      maxPrice: 200000,
    });

    component['applyFilters']();

    expect(component['visibleListings']().map((listing) => listing.id)).toEqual([1]);
  });

  it('should sort listings by newest first', () => {
    expect(component['visibleListings']().map((listing) => listing.id)).toEqual([2, 1]);
  });
});

function createListing(
  id: number,
  city: string,
  propertyType: PropertyType,
  askingPrice: number,
  createdAt = '2026-06-02T00:00:00Z',
): PropertyListing {
  return {
    id,
    propertyId: id,
    userId: 1,
    userFullName: 'Alex Morgan',
    title: `Listing ${id}`,
    askingPrice,
    status: ListingStatus.Active,
    createdAt,
    updatedAt: null,
    property: {
      id,
      address: {
        id,
        street: 'Main Street',
        city,
        county: 'County',
      },
      propertyType,
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
