import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ListingStatus, PropertyListing, PropertyRecord, PropertyType } from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';
import { PropertyService } from '../../../../core/services/property.service';
import { Sell } from './sell';

describe('Sell', () => {
  let component: Sell;
  let fixture: ComponentFixture<Sell>;
  let propertyService: { createProperty: ReturnType<typeof vi.fn> };
  let listingService: { createListing: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    propertyService = {
      createProperty: vi.fn().mockResolvedValue(createProperty(42)),
    };
    listingService = {
      createListing: vi.fn().mockResolvedValue(createListing(9, 42)),
    };

    await TestBed.configureTestingModule({
      imports: [Sell],
      providers: [
        provideRouter([]),
        { provide: PropertyService, useValue: propertyService },
        { provide: ListingService, useValue: listingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Sell);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fillValidForm(component);
  });

  it('should create a property and listing', async () => {
    await component['submit']();

    expect(propertyService.createProperty).toHaveBeenCalledTimes(1);
    expect(listingService.createListing).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 42, status: ListingStatus.Active }),
    );
  });

  it('should retry listing creation without creating another property', async () => {
    listingService.createListing
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(createListing(10, 42));

    await component['submit']();
    await component['submit']();

    expect(propertyService.createProperty).toHaveBeenCalledTimes(1);
    expect(listingService.createListing).toHaveBeenCalledTimes(2);
  });

  it('should create a new property on retry when property details changed', async () => {
    listingService.createListing
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(createListing(10, 42));

    await component['submit']();
    component['sellForm'].patchValue({ city: 'Brasov' });
    await component['submit']();

    expect(propertyService.createProperty).toHaveBeenCalledTimes(2);
  });
});

function fillValidForm(component: Sell): void {
  component['sellForm'].setValue({
    street: 'Main Street',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    propertyType: PropertyType.Apartment,
    area: 80,
    bedrooms: 2,
    bathrooms: 1,
    yearBuilt: 2020,
    description: 'A good apartment.',
    title: 'Central apartment',
    askingPrice: 150000,
    status: ListingStatus.Active,
  });
}

function createProperty(id: number): PropertyRecord {
  return {
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
    description: 'A good apartment.',
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
  };
}

function createListing(id: number, propertyId: number): PropertyListing {
  return {
    id,
    propertyId,
    userId: 1,
    userFullName: 'Alex Morgan',
    title: 'Central apartment',
    askingPrice: 150000,
    status: ListingStatus.Active,
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
    property: createProperty(propertyId),
  };
}
