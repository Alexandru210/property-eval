import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ListingStatus, PropertyListing, PropertyType } from '../../../../core/models/property.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ListingService } from '../../../../core/services/listing.service';
import { SavedPropertyService } from '../../../../core/services/saved-property.service';
import { ListingDetail } from './listing-detail';

describe('ListingDetail', () => {
  let fixture: ComponentFixture<ListingDetail>;
  let component: ListingDetail;
  let routeId: string | null;
  let listingService: { getListing: ReturnType<typeof vi.fn> };
  let savedPropertyService: {
    isSaved: ReturnType<typeof vi.fn>;
    toggleSaved: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    routeId = '12';
    listingService = {
      getListing: vi.fn().mockResolvedValue(createListing(12)),
    };
    savedPropertyService = {
      isSaved: vi.fn().mockReturnValue(true),
      toggleSaved: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [ListingDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn(() => routeId),
              },
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(true),
          },
        },
        { provide: ListingService, useValue: listingService },
        { provide: SavedPropertyService, useValue: savedPropertyService },
      ],
    }).compileComponents();
  });

  it('should load the listing from the route id and initialize saved state', async () => {
    await createComponent();

    expect(listingService.getListing).toHaveBeenCalledWith(12);
    expect(savedPropertyService.isSaved).toHaveBeenCalledWith(12);
    expect(component['listing']()?.title).toBe('Central apartment');
    expect(component['isSaved']()).toBe(true);
    expect(component['isLoading']()).toBe(false);
  });

  it('should show an error when the route id is invalid', async () => {
    routeId = 'not-a-number';

    await createComponent();

    expect(listingService.getListing).not.toHaveBeenCalled();
    expect(component['loadError']()).toBe('The listing id is invalid.');
    expect(component['isLoading']()).toBe(false);
  });

  it('should show an error when the listing request fails', async () => {
    listingService.getListing.mockRejectedValue(new Error('Network error'));

    await createComponent();

    expect(component['loadError']()).toBe('Could not load this listing right now.');
    expect(component['listing']()).toBeNull();
    expect(component['isLoading']()).toBe(false);
  });

  it('should open, navigate, wrap, and close gallery photos', async () => {
    await createComponent();
    const listing = component['listing']()!;

    component['openPhoto'](1);
    expect(component['selectedPhotoIndex']()).toBe(1);

    component['showNextPhoto'](listing);
    expect(component['selectedPhotoIndex']()).toBe(2);

    component['showNextPhoto'](listing);
    expect(component['selectedPhotoIndex']()).toBe(0);

    component['showPreviousPhoto'](listing);
    expect(component['selectedPhotoIndex']()).toBe(2);

    component['handleEscape']();
    expect(component['selectedPhotoIndex']()).toBeNull();
  });

  it('should ignore invalid photo indexes', async () => {
    await createComponent();

    component['openPhoto'](99);

    expect(component['selectedPhotoIndex']()).toBeNull();
  });

  it('should update saved state after toggling the listing', async () => {
    await createComponent();
    const listing = component['listing']()!;

    component['toggleSaved'](listing);

    expect(savedPropertyService.toggleSaved).toHaveBeenCalledWith(12);
    expect(component['isSaved']()).toBe(false);
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(ListingDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }
});

function createListing(id: number): PropertyListing {
  return {
    id,
    propertyId: id,
    userId: 1,
    userFullName: 'Alex Morgan',
    title: 'Central apartment',
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
      description: 'A good apartment.',
      images: [
        createImage(1, id, '/images/front.jpg'),
        createImage(2, id, '/images/kitchen.jpg'),
        createImage(3, id, '/images/bedroom.jpg'),
      ],
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: null,
    },
  };
}

function createImage(id: number, propertyId: number, imageUrl: string) {
  return {
    id,
    propertyId,
    imageUrl,
    description: null,
    uploadedAt: '2026-06-02T00:00:00Z',
  };
}
