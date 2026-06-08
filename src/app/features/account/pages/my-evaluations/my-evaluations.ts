import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  EvaluationStatus,
  PropertyEvaluation,
  getEvaluationStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { EvaluationService } from '../../../../core/services/evaluation.service';

@Component({
  selector: 'app-my-evaluations',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './my-evaluations.html',
  styleUrl: './my-evaluations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEvaluations {
  private readonly evaluationService = inject(EvaluationService);

  protected readonly evaluations = signal<PropertyEvaluation[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly stats = computed(() => {
    const evaluations = this.evaluations();

    return [
      {
        label: 'Completed reports',
        value: String(evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.Completed).length),
      },
      {
        label: 'Pending reviews',
        value: String(evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.Pending).length),
      },
      {
        label: 'In progress',
        value: String(evaluations.filter((evaluation) => evaluation.status === EvaluationStatus.InProgress).length),
      },
    ];
  });

  constructor() {
    void this.loadEvaluations();
  }

  protected getEvaluationStatus(status: EvaluationStatus): string {
    return getEvaluationStatusLabel(status);
  }

  protected getPropertyType(evaluation: PropertyEvaluation): string {
    return getPropertyTypeLabel(evaluation.property.propertyType);
  }

  protected trackEvaluation(_index: number, evaluation: PropertyEvaluation): number {
    return evaluation.id;
  }

  private async loadEvaluations(): Promise<void> {
    try {
      this.evaluations.set(await this.evaluationService.getEvaluations());
    } catch {
      this.loadError.set('Could not load your evaluations right now.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
