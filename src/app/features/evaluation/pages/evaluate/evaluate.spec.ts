import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  EvaluationStatus,
  PropertyEvaluation,
  PropertyRecord,
  PropertyType,
  PropertyValuation,
} from '../../../../core/models/property.model';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { PropertyService } from '../../../../core/services/property.service';
import { Evaluate } from './evaluate';

describe('Evaluate', () => {
  let component: Evaluate;
  let fixture: ComponentFixture<Evaluate>;
  let propertyService: {
    createProperty: ReturnType<typeof vi.fn>;
    uploadPropertyImages: ReturnType<typeof vi.fn>;
    getPropertyValuation: ReturnType<typeof vi.fn>;
  };
  let evaluationService: { createEvaluation: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    propertyService = {
      createProperty: vi.fn().mockResolvedValue(createProperty(42)),
      uploadPropertyImages: vi.fn().mockResolvedValue([
        {
          id: 1,
          propertyId: 42,
          imageUrl: '/uploads/properties/42/front.jpg',
          description: null,
          uploadedAt: '2026-06-02T00:00:00Z',
        },
      ]),
      getPropertyValuation: vi.fn().mockResolvedValue(createValuation(42)),
    };
    evaluationService = {
      createEvaluation: vi.fn().mockResolvedValue(createEvaluation(5, 42)),
    };

    await TestBed.configureTestingModule({
      imports: [Evaluate],
      providers: [
        provideRouter([]),
        { provide: PropertyService, useValue: propertyService },
        { provide: EvaluationService, useValue: evaluationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Evaluate);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fillValidForm(component);
    addSelectedImage(component);
  });

  it('should create a property and evaluation request', async () => {
    await component['submit']();

    expect(propertyService.createProperty).toHaveBeenCalledTimes(1);
    expect(propertyService.uploadPropertyImages).toHaveBeenCalledWith(42, [expect.any(File)]);
    expect(evaluationService.createEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 42, notes: 'Needs review.' }),
    );
    expect(propertyService.getPropertyValuation).toHaveBeenCalledWith(42);
    expect(component['propertyValuation']()?.predictedValue).toBe(150000);
  });

  it('should retry evaluation creation without creating another property', async () => {
    evaluationService.createEvaluation
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(createEvaluation(6, 42));

    await component['submit']();
    await component['submit']();

    expect(propertyService.createProperty).toHaveBeenCalledTimes(1);
    expect(propertyService.uploadPropertyImages).toHaveBeenCalledTimes(1);
    expect(evaluationService.createEvaluation).toHaveBeenCalledTimes(2);
  });

  it('should create a new property on retry when property details changed', async () => {
    evaluationService.createEvaluation
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce(createEvaluation(6, 42));

    await component['submit']();
    component['evaluationForm'].patchValue({ city: 'Brasov' });
    await component['submit']();

    expect(propertyService.createProperty).toHaveBeenCalledTimes(2);
    expect(propertyService.uploadPropertyImages).toHaveBeenCalledTimes(2);
  });

  it('should require photos before creating an evaluation request', async () => {
    component['selectedImages'].set([]);

    await component['submit']();

    expect(propertyService.createProperty).not.toHaveBeenCalled();
    expect(propertyService.uploadPropertyImages).not.toHaveBeenCalled();
    expect(evaluationService.createEvaluation).not.toHaveBeenCalled();
    expect(component['photoError']()).toContain('Add at least one property photo');
  });
});

function fillValidForm(component: Evaluate): void {
  component['evaluationForm'].setValue({
    street: 'Main Street',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    propertyType: PropertyType.Apartment,
    area: 80,
    bedrooms: 2,
    bathrooms: 1,
    yearBuilt: 2020,
    description: 'A good apartment.',
    notes: 'Needs review.',
  });
}

function addSelectedImage(component: Evaluate): void {
  const file = new File(['photo'], 'front.jpg', { type: 'image/jpeg', lastModified: 1 });

  component['selectedImages'].set([
    {
      id: 'front-photo',
      file,
      previewUrl: '',
    },
  ]);
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
    images: [],
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
  };
}

function createEvaluation(id: number, propertyId: number): PropertyEvaluation {
  return {
    id,
    propertyId,
    requestedByUserId: 1,
    requestedByUserFullName: 'Alex Morgan',
    evaluatorUserId: null,
    evaluatorUserFullName: null,
    evaluatedValue: 0,
    status: EvaluationStatus.Pending,
    notes: 'Needs review.',
    evaluationDate: '2026-06-02T00:00:00Z',
    createdAt: '2026-06-02T00:00:00Z',
    updatedAt: null,
    property: createProperty(propertyId),
  };
}

function createValuation(propertyId: number): PropertyValuation {
  return {
    propertyId,
    predictedValue: 150000,
    predictionLowerBound: 135000,
    predictionUpperBound: 165000,
    trainingRowCount: 24,
    rSquared: 0.82,
    meanAbsoluteError: 7000,
    rootMeanSquaredError: 9000,
    modelName: 'ML.NET',
  };
}
