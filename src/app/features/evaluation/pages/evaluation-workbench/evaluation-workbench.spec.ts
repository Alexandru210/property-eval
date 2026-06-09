import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { User } from '../../../../core/models/user.model';
import { EvaluationStatus, PropertyEvaluation, PropertyType } from '../../../../core/models/property.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { EvaluationWorkbench } from './evaluation-workbench';

describe('EvaluationWorkbench', () => {
  let component: EvaluationWorkbench;
  let fixture: ComponentFixture<EvaluationWorkbench>;
  let evaluationService: {
    getEvaluations: ReturnType<typeof vi.fn>;
    completeEvaluation: ReturnType<typeof vi.fn>;
  };
  let currentUser: ReturnType<typeof signal<User | null>>;

  beforeEach(async () => {
    currentUser = signal<User | null>(createUser('admin'));
    evaluationService = {
      getEvaluations: vi.fn().mockResolvedValue([
        createEvaluation(1, EvaluationStatus.Pending),
        createEvaluation(2, EvaluationStatus.InProgress),
        createEvaluation(3, EvaluationStatus.Completed),
        createEvaluation(4, EvaluationStatus.Rejected),
      ]),
      completeEvaluation: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EvaluationWorkbench],
      providers: [
        { provide: AuthService, useValue: { currentUser } },
        { provide: EvaluationService, useValue: evaluationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EvaluationWorkbench);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should load evaluations on create', () => {
    expect(component).toBeTruthy();
    expect(evaluationService.getEvaluations).toHaveBeenCalledWith({ pageSize: 100 });
    expect(component['evaluations']().length).toBe(4);
  });

  it('should display status stats and filter visible rows', () => {
    expect(component['stats']().map((stat) => `${stat.label}:${stat.value}`)).toEqual([
      'All requests:4',
      'Pending:1',
      'In progress:1',
      'Completed:1',
    ]);

    component['setStatusFilter'](EvaluationStatus.Completed);

    expect(component['visibleEvaluations']().map((evaluation) => evaluation.id)).toEqual([3]);
  });

  it('should open completion only for pending or in-progress evaluations', () => {
    component['openCompletion'](component['evaluations']()[0]);
    expect(component['activeEvaluationId']()).toBe(1);

    component['openCompletion'](component['evaluations']()[2]);
    expect(component['activeEvaluationId']()).toBe(1);
  });

  it('should block completion when evaluated value is not positive', async () => {
    const evaluation = component['evaluations']()[0];
    component['openCompletion'](evaluation);
    component['completionForm'].patchValue({ evaluatedValue: 0 });

    await component['submitCompletion'](evaluation);

    expect(evaluationService.completeEvaluation).not.toHaveBeenCalled();
    expect(component['completionForm'].invalid).toBe(true);
  });

  it('should call completeEvaluation with trimmed notes and selected id', async () => {
    const evaluation = component['evaluations']()[1];
    const completedEvaluation = {
      ...evaluation,
      evaluatedValue: 185000,
      status: EvaluationStatus.Completed,
      notes: 'Final review.',
    };
    evaluationService.completeEvaluation.mockResolvedValue(completedEvaluation);

    component['openCompletion'](evaluation);
    component['completionForm'].patchValue({
      evaluatedValue: 185000,
      evaluationDate: '2026-06-09',
      notes: '  Final review.  ',
    });

    await component['submitCompletion'](evaluation);

    expect(evaluationService.completeEvaluation).toHaveBeenCalledWith({
      id: 2,
      evaluatedValue: 185000,
      notes: 'Final review.',
      evaluationDate: '2026-06-09T00:00:00Z',
    });
  });

  it('should update the row after successful completion', async () => {
    const evaluation = component['evaluations']()[0];
    const completedEvaluation = {
      ...evaluation,
      evaluatedValue: 170000,
      status: EvaluationStatus.Completed,
    };
    evaluationService.completeEvaluation.mockResolvedValue(completedEvaluation);

    component['openCompletion'](evaluation);
    component['completionForm'].patchValue({ evaluatedValue: 170000 });
    await component['submitCompletion'](evaluation);

    expect(component['evaluations']().find((item) => item.id === 1)?.status).toBe(EvaluationStatus.Completed);
    expect(component['evaluations']().find((item) => item.id === 1)?.evaluatedValue).toBe(170000);
    expect(component['completionSuccess']()).toBe('Evaluation #1 was completed.');
  });

  it('should show an error message if completion fails', async () => {
    const evaluation = component['evaluations']()[0];
    evaluationService.completeEvaluation.mockRejectedValue(new Error('Failed'));

    component['openCompletion'](evaluation);
    component['completionForm'].patchValue({ evaluatedValue: 170000 });
    await component['submitCompletion'](evaluation);

    expect(component['completionError']()).toBe('The evaluation could not be completed. Please review the value and try again.');
  });
});

function createUser(role: User['role']): User {
  return {
    id: 12,
    email: 'alex@example.com',
    firstName: 'Alex',
    lastName: 'Morgan',
    name: 'Alex Morgan',
    role,
    backendRole: role,
  };
}

function createEvaluation(id: number, status: EvaluationStatus): PropertyEvaluation {
  return {
    id,
    propertyId: id + 40,
    requestedByUserId: 7,
    requestedByUserFullName: 'Alex Morgan',
    evaluatorUserId: status === EvaluationStatus.Pending ? null : 8,
    evaluatorUserFullName: status === EvaluationStatus.Pending ? null : 'Eva Stone',
    evaluatedValue: status === EvaluationStatus.Completed ? 175000 : 0,
    status,
    notes: 'Needs review.',
    evaluationDate: `2026-06-0${id}T00:00:00Z`,
    createdAt: `2026-06-0${id}T00:00:00Z`,
    updatedAt: null,
    property: {
      id: id + 40,
      address: {
        id: id + 40,
        street: `${id} Main Street`,
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
