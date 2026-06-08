import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EvaluationStatus, PropertyEvaluation, PropertyType } from '../../../../core/models/property.model';
import { EvaluationService } from '../../../../core/services/evaluation.service';

import { MyEvaluations } from './my-evaluations';

describe('MyEvaluations', () => {
  let component: MyEvaluations;
  let fixture: ComponentFixture<MyEvaluations>;
  let evaluationService: { getEvaluations: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    evaluationService = {
      getEvaluations: vi.fn().mockResolvedValue([createEvaluation(1)]),
    };

    await TestBed.configureTestingModule({
      imports: [MyEvaluations],
      providers: [
        provideRouter([]),
        { provide: EvaluationService, useValue: evaluationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyEvaluations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load evaluations for the current user', () => {
    expect(evaluationService.getEvaluations).toHaveBeenCalled();
    expect(component['evaluations']().length).toBe(1);
  });
});

function createEvaluation(id: number): PropertyEvaluation {
  return {
    id,
    propertyId: 42,
    requestedByUserId: 7,
    requestedByUserFullName: 'Alex Morgan',
    evaluatorUserId: null,
    evaluatorUserFullName: null,
    evaluatedValue: 0,
    status: EvaluationStatus.Pending,
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
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: null,
    },
  };
}
