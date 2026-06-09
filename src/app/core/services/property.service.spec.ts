import { HttpClient, HttpParams } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PropertyRecord, PropertyType } from '../models/property.model';
import { PropertyService } from './property.service';

describe('PropertyService', () => {
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: PropertyService;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PropertyService,
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(PropertyService);
  });

  it('should request properties with serialized filters', async () => {
    const response = [createProperty(1)];
    http.get.mockReturnValue(of(response));

    const result = await service.getProperties({
      city: 'Cluj-Napoca',
      propertyType: PropertyType.Apartment,
      page: 1,
      pageSize: 20,
    });

    const [, options] = http.get.mock.calls[0] as [string, { params: HttpParams }];
    expect(result).toBe(response);
    expect(http.get).toHaveBeenCalledWith(`${environment.apiUrl}/properties`, expect.any(Object));
    expect(options.params.get('city')).toBe('Cluj-Napoca');
    expect(options.params.get('propertyType')).toBe('0');
    expect(options.params.get('page')).toBe('1');
    expect(options.params.get('pageSize')).toBe('20');
  });

  it('should request a single property and its valuation by id', async () => {
    const property = createProperty(42);
    const valuation = {
      propertyId: 42,
      predictedValue: 180000,
      predictionLowerBound: 165000,
      predictionUpperBound: 195000,
      trainingRowCount: 250,
      rSquared: 0.82,
      meanAbsoluteError: 8500,
      rootMeanSquaredError: 12000,
      modelName: 'baseline',
    };
    http.get.mockReturnValueOnce(of(property)).mockReturnValueOnce(of(valuation));

    await expect(service.getProperty(42)).resolves.toBe(property);
    await expect(service.getPropertyValuation(42)).resolves.toBe(valuation);

    expect(http.get).toHaveBeenNthCalledWith(1, `${environment.apiUrl}/properties/42`);
    expect(http.get).toHaveBeenNthCalledWith(2, `${environment.apiUrl}/properties/42/valuation`);
  });

  it('should create a property with the provided request body', async () => {
    const request = {
      address: {
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
    };
    const response = createProperty(9);
    http.post.mockReturnValue(of(response));

    await expect(service.createProperty(request)).resolves.toBe(response);

    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}/properties`, request);
  });

  it('should upload selected files as multipart form data', async () => {
    const file = new File(['image'], 'front.jpg', { type: 'image/jpeg' });
    const response = [{ id: 1, propertyId: 9, imageUrl: '/images/front.jpg', description: null, uploadedAt: '2026-06-09T00:00:00Z' }];
    http.post.mockReturnValue(of(response));

    await expect(service.uploadPropertyImages(9, [file])).resolves.toBe(response);

    const [, body] = http.post.mock.calls[0] as [string, FormData];
    expect(http.post).toHaveBeenCalledWith(`${environment.apiUrl}/properties/9/images`, expect.any(FormData));
    expect(body.getAll('files')).toEqual([file]);
  });

  it('should delete a property image by property and image id', async () => {
    http.delete.mockReturnValue(of(undefined));

    await expect(service.deletePropertyImage(9, 3)).resolves.toBeUndefined();

    expect(http.delete).toHaveBeenCalledWith(`${environment.apiUrl}/properties/9/images/3`);
  });
});

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
    images: [],
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
  };
}
