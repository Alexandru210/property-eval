import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EvaluationStatus,
  PropertyEvaluation,
  getEvaluationStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { AuthService } from '../../../../core/services/auth.service';
import { EvaluationService } from '../../../../core/services/evaluation.service';

type EvaluationStatusFilter = EvaluationStatus | 'all';
type CompletionControlName = 'evaluatedValue' | 'notes';

@Component({
  selector: 'app-evaluation-workbench',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './evaluation-workbench.html',
  styleUrl: './evaluation-workbench.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvaluationWorkbench {
  private readonly authService = inject(AuthService);
  private readonly evaluationService = inject(EvaluationService);
  private readonly fb = inject(FormBuilder);

  protected readonly evaluations = signal<PropertyEvaluation[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly activeStatus = signal<EvaluationStatusFilter>('all');
  protected readonly activeEvaluationId = signal<number | null>(null);
  protected readonly isCompleting = signal(false);
  protected readonly completionError = signal<string | null>(null);
  protected readonly completionSuccess = signal<string | null>(null);

  protected readonly statusFilters: Array<{ value: EvaluationStatusFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: EvaluationStatus.Pending, label: 'Pending' },
    { value: EvaluationStatus.InProgress, label: 'In progress' },
    { value: EvaluationStatus.Completed, label: 'Completed' },
  ];

  protected readonly completionForm = this.fb.group({
    evaluatedValue: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    evaluationDate: [this.getTodayInputValue()],
    notes: ['', [Validators.maxLength(2000)]],
  });

  protected readonly intro = computed(() =>
    this.authService.currentUser()?.role === 'admin'
      ? 'All evaluation requests'
      : 'Assigned evaluation requests',
  );

  protected readonly stats = computed(() => {
    const evaluations = this.evaluations();

    return [
      { label: 'All requests', value: String(evaluations.length) },
      {
        label: 'Pending',
        value: String(evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.Pending).length),
      },
      {
        label: 'In progress',
        value: String(evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.InProgress).length),
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
      .filter((evaluation) => activeStatus === 'all' || evaluation.status === activeStatus)
      .sort((first, second) => Date.parse(second.evaluationDate) - Date.parse(first.evaluationDate));
  });

  constructor() {
    void this.loadEvaluations();
  }

  protected setStatusFilter(status: EvaluationStatusFilter): void {
    this.activeStatus.set(status);
    this.activeEvaluationId.set(null);
    this.completionError.set(null);
  }

  protected openCompletion(evaluation: PropertyEvaluation): void {
    if (!this.isCompletable(evaluation)) {
      return;
    }

    this.activeEvaluationId.set(evaluation.id);
    this.completionError.set(null);
    this.completionSuccess.set(null);
    this.completionForm.reset({
      evaluatedValue: evaluation.evaluatedValue > 0 ? evaluation.evaluatedValue : null,
      evaluationDate: this.toDateInputValue(evaluation.evaluationDate) ?? this.getTodayInputValue(),
      notes: evaluation.notes ?? '',
    });
  }

  protected closeCompletion(): void {
    this.activeEvaluationId.set(null);
    this.completionError.set(null);
  }

  protected async submitCompletion(evaluation: PropertyEvaluation): Promise<void> {
    this.completionError.set(null);
    this.completionSuccess.set(null);

    if (this.completionForm.invalid) {
      this.completionForm.markAllAsTouched();
      return;
    }

    const formValue = this.completionForm.getRawValue();
    const notes = formValue.notes?.trim() ?? '';

    this.isCompleting.set(true);

    try {
      const updatedEvaluation = await this.evaluationService.completeEvaluation({
        id: evaluation.id,
        evaluatedValue: Number(formValue.evaluatedValue),
        notes: notes || null,
        evaluationDate: this.toEvaluationDateTime(formValue.evaluationDate ?? ''),
      });

      this.evaluations.update((evaluations) =>
        evaluations.map((item) => item.id === updatedEvaluation.id ? updatedEvaluation : item),
      );
      this.activeEvaluationId.set(null);
      this.completionSuccess.set(`Evaluation #${updatedEvaluation.id} was completed.`);
    } catch (error) {
      this.completionError.set(this.getCompletionErrorMessage(error));
    } finally {
      this.isCompleting.set(false);
    }
  }

  protected hasError(controlName: CompletionControlName, errorName: string): boolean {
    const control = this.completionForm.controls[controlName];

    return control.hasError(errorName) && (control.dirty || control.touched);
  }

  protected isCompletable(evaluation: PropertyEvaluation): boolean {
    return evaluation.status === EvaluationStatus.Pending || evaluation.status === EvaluationStatus.InProgress;
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

  protected trackEvaluation(_index: number, evaluation: PropertyEvaluation): number {
    return evaluation.id;
  }

  private async loadEvaluations(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      this.evaluations.set(await this.evaluationService.getEvaluations({ pageSize: 100 }));
    } catch {
      this.loadError.set('Could not load evaluation requests right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getCompletionErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendMessage(error);

      if (backendMessage) {
        return backendMessage;
      }
    }

    return 'The evaluation could not be completed. Please review the value and try again.';
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

  private getTodayInputValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private toDateInputValue(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  private toEvaluationDateTime(value: string): string | null {
    return value ? `${value}T00:00:00Z` : null;
  }
}
