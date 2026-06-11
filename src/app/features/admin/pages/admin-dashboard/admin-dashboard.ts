import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  EvaluationStatus,
  PropertyEvaluation,
  getEvaluationStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { User } from '../../../../core/models/user.model';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { UserService } from '../../../../core/services/user.service';

type EvaluationStatusFilter = EvaluationStatus.Pending | EvaluationStatus.InProgress | 'all';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly evaluationService = inject(EvaluationService);
  private readonly userService = inject(UserService);

  protected readonly evaluations = signal<PropertyEvaluation[]>([]);
  protected readonly evaluators = signal<User[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activeStatus = signal<EvaluationStatusFilter>('all');
  protected readonly selectedEvaluatorIds = signal<Record<number, number>>({});
  protected readonly assigningEvaluationId = signal<number | null>(null);
  protected readonly assignmentError = signal<string | null>(null);
  protected readonly assignmentSuccess = signal<string | null>(null);

  protected readonly statusFilters: Array<{ value: EvaluationStatusFilter; label: string }> = [
    { value: 'all', label: 'Open' },
    { value: EvaluationStatus.Pending, label: 'Pending' },
    { value: EvaluationStatus.InProgress, label: 'In progress' },
  ];

  protected readonly stats = computed(() => {
    const evaluations = this.evaluations();

    return [
      {
        label: 'Open requests',
        value: String(evaluations.filter((evaluation) => this.isAssignable(evaluation)).length),
      },
      {
        label: 'Unassigned',
        value: String(
          evaluations.filter((evaluation) => this.isAssignable(evaluation) && evaluation.evaluatorUserId === null).length,
        ),
      },
      {
        label: 'Evaluators',
        value: String(this.evaluators().length),
      },
      {
        label: 'Completed',
        value: String(evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.Completed).length),
      },
    ];
  });

  protected readonly visibleEvaluations = computed(() => {
    const activeStatus = this.activeStatus();

    return this.evaluations()
      .filter((evaluation) => this.isAssignable(evaluation))
      .filter((evaluation) => activeStatus === 'all' || evaluation.status === activeStatus)
      .sort((first, second) => {
        if (first.evaluatorUserId === null && second.evaluatorUserId !== null) {
          return -1;
        }

        if (first.evaluatorUserId !== null && second.evaluatorUserId === null) {
          return 1;
        }

        return Date.parse(second.createdAt) - Date.parse(first.createdAt);
      });
  });

  constructor() {
    void this.loadDashboard();
  }

  protected setStatusFilter(status: EvaluationStatusFilter): void {
    this.activeStatus.set(status);
  }

  protected onEvaluatorChange(evaluationId: number, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const evaluatorUserId = Number(target.value);

    this.selectedEvaluatorIds.update((selectedEvaluatorIds) => ({
      ...selectedEvaluatorIds,
      [evaluationId]: evaluatorUserId,
    }));
  }

  protected async assignEvaluation(evaluation: PropertyEvaluation): Promise<void> {
    const evaluatorUserId = this.getSelectedEvaluatorId(evaluation);

    this.assignmentError.set(null);
    this.assignmentSuccess.set(null);

    if (!evaluatorUserId) {
      this.assignmentError.set('Choose an evaluator before assigning this request.');
      return;
    }

    this.assigningEvaluationId.set(evaluation.id);

    try {
      const updatedEvaluation = await this.evaluationService.assignEvaluation({
        id: evaluation.id,
        evaluatorUserId,
      });

      this.evaluations.update((evaluations) =>
        evaluations.map((item) => item.id === updatedEvaluation.id ? updatedEvaluation : item),
      );
      this.selectedEvaluatorIds.update((selectedEvaluatorIds) => ({
        ...selectedEvaluatorIds,
        [updatedEvaluation.id]: updatedEvaluation.evaluatorUserId ?? evaluatorUserId,
      }));
      this.assignmentSuccess.set(`Evaluation #${updatedEvaluation.id} assigned to ${updatedEvaluation.evaluatorUserFullName}.`);
    } catch (error) {
      this.assignmentError.set(this.getAssignmentErrorMessage(error));
    } finally {
      this.assigningEvaluationId.set(null);
    }
  }

  protected getSelectedEvaluatorId(evaluation: PropertyEvaluation): number {
    return this.selectedEvaluatorIds()[evaluation.id] ?? evaluation.evaluatorUserId ?? 0;
  }

  protected getEvaluatorName(evaluatorUserId: number | null): string {
    if (evaluatorUserId === null) {
      return 'Unassigned';
    }

    return this.evaluators().find((evaluator) => evaluator.id === evaluatorUserId)?.name ?? 'Assigned evaluator';
  }

  protected getEvaluationStatus(status: EvaluationStatus): string {
    return getEvaluationStatusLabel(status);
  }

  protected getPropertyType(evaluation: PropertyEvaluation): string {
    return getPropertyTypeLabel(evaluation.property.propertyType);
  }

  protected getStatusClass(status: EvaluationStatus): string {
    return `status-${EvaluationStatus[status].toLowerCase()}`;
  }

  protected isAssignable(evaluation: PropertyEvaluation): boolean {
    return evaluation.status === EvaluationStatus.Pending || evaluation.status === EvaluationStatus.InProgress;
  }

  protected trackEvaluation(_index: number, evaluation: PropertyEvaluation): number {
    return evaluation.id;
  }

  protected trackEvaluator(_index: number, evaluator: User): number {
    return evaluator.id;
  }

  private async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const [evaluations, evaluators] = await Promise.all([
        this.evaluationService.getEvaluations({ pageSize: 100 }),
        this.userService.getEvaluators(),
      ]);

      this.evaluations.set(evaluations);
      this.evaluators.set(evaluators);
      this.selectedEvaluatorIds.set(this.buildInitialEvaluatorSelections(evaluations, evaluators));
    } catch {
      this.loadError.set('Could not load admin assignment data right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private buildInitialEvaluatorSelections(
    evaluations: PropertyEvaluation[],
    _evaluators: User[],
  ): Record<number, number> {
    return evaluations.reduce<Record<number, number>>((selectedEvaluatorIds, evaluation) => {
      selectedEvaluatorIds[evaluation.id] = evaluation.evaluatorUserId ?? 0;

      return selectedEvaluatorIds;
    }, {});
  }

  private getAssignmentErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendMessage(error);

      if (backendMessage) {
        return backendMessage;
      }
    }

    return 'The evaluation could not be assigned. Please try again.';
  }

  private extractBackendMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (typeof error.error?.detail === 'string') {
      return error.error.detail;
    }

    if (typeof error.error?.title === 'string') {
      return error.error.title;
    }

    if (typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return null;
  }
}
