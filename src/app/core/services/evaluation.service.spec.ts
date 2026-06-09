import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EvaluationStatus, PropertyEvaluation, PropertyType } from '../models/property.model';
import { EvaluationService } from './evaluation.service';

describe('EvaluationService', () => {
  let http: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
  let service: EvaluationService;

  beforeEach(() => {
    http = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EvaluationService,
        { provide: HttpClient, useValue: http },
      ],
    });

    service = TestBed.inject(EvaluationService);
  });

  it('should complete an evaluation with a PATCH request', async () => {
    const response = createEvaluation(4, EvaluationStatus.Completed);
    const request = {
      id: 4,
      evaluatedValue: 175000,
      notes: 'Reviewed.',
      evaluationDate: '2026-06-09T00:00:00Z',
    };
    http.patch.mockReturnValue(of(response));

    const result = await service.completeEvaluation(request);

    expect(result).toBe(response);
    expect(http.patch).toHaveBeenCalledWith(`${environment.apiUrl}/evaluations/4`, request);
  });
});

function createEvaluation(id: number, status: EvaluationStatus): PropertyEvaluation {
  return {
    id,
    propertyId: 42,
    requestedByUserId: 7,
    requestedByUserFullName: 'Alex Morgan',
    evaluatorUserId: 8,
    evaluatorUserFullName: 'Eva Stone',
    evaluatedValue: status === EvaluationStatus.Completed ? 175000 : 0,
    status,
    notes: 'Needs review.',
    evaluationDate: '2026-06-02T00:00:00Z',
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
    property: {
      id: 42,
      address: {
        id: 42,
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
    },
  };
}
