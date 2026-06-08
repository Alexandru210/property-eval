import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MyListings } from './my-listings';
import { AuthService } from '../../../../core/services/auth.service';
import { ListingService } from '../../../../core/services/listing.service';

describe('MyListings', () => {
  let component: MyListings;
  let fixture: ComponentFixture<MyListings>;
  let listingService: { getAllListings: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    listingService = {
      getAllListings: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [MyListings],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({ id: 7, name: 'Alex Morgan' }),
          },
        },
        { provide: ListingService, useValue: listingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyListings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load listings for the current user', () => {
    expect(listingService.getAllListings).toHaveBeenCalledWith({ userId: 7 });
  });
});
