import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  EvaluationStatus,
  PropertyImage,
  PropertyEvaluation,
  getEvaluationStatusLabel,
  getPropertyTypeLabel,
} from '../../../../core/models/property.model';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { resolveApiImageUrl } from '../../../../core/services/image-url';

type SelectedPhoto = { evaluationId: number; photoIndex: number };

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
  protected readonly selectedPhoto = signal<SelectedPhoto | null>(null);

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

  protected getImageUrl(image: PropertyImage): string {
    return resolveApiImageUrl(image.imageUrl);
  }

  protected getPrimaryImageUrl(evaluation: PropertyEvaluation): string | null {
    const image = evaluation.property.images[0];

    return image ? this.getImageUrl(image) : null;
  }

  protected openPhoto(evaluation: PropertyEvaluation, index: number): void {
    if (!evaluation.property.images[index]) {
      return;
    }

    this.selectedPhoto.set({ evaluationId: evaluation.id, photoIndex: index });
  }

  protected closePhoto(): void {
    this.selectedPhoto.set(null);
  }

  protected getSelectedPhoto(evaluation: PropertyEvaluation): PropertyImage | null {
    const selectedPhoto = this.selectedPhoto();

    if (!selectedPhoto || selectedPhoto.evaluationId !== evaluation.id) {
      return null;
    }

    return evaluation.property.images[selectedPhoto.photoIndex] ?? null;
  }

  protected showPreviousPhoto(evaluation: PropertyEvaluation): void {
    this.moveSelectedPhoto(evaluation, -1);
  }

  protected showNextPhoto(evaluation: PropertyEvaluation): void {
    this.moveSelectedPhoto(evaluation, 1);
  }

  protected getSelectedPhotoNumber(evaluation: PropertyEvaluation): number {
    const selectedPhoto = this.selectedPhoto();

    return selectedPhoto?.evaluationId === evaluation.id ? selectedPhoto.photoIndex + 1 : 1;
  }

  protected trackEvaluation(_index: number, evaluation: PropertyEvaluation): number {
    return evaluation.id;
  }

  @HostListener('document:keydown.escape')
  protected handleEscape(): void {
    this.closePhoto();
  }

  @HostListener('document:keydown.arrowleft')
  protected handleArrowLeft(): void {
    const evaluation = this.getSelectedEvaluation();

    if (evaluation) {
      this.showPreviousPhoto(evaluation);
    }
  }

  @HostListener('document:keydown.arrowright')
  protected handleArrowRight(): void {
    const evaluation = this.getSelectedEvaluation();

    if (evaluation) {
      this.showNextPhoto(evaluation);
    }
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

  private moveSelectedPhoto(evaluation: PropertyEvaluation, offset: number): void {
    const selectedPhoto = this.selectedPhoto();
    const photoCount = evaluation.property.images.length;

    if (!selectedPhoto || selectedPhoto.evaluationId !== evaluation.id || photoCount < 2) {
      return;
    }

    this.selectedPhoto.set({
      evaluationId: evaluation.id,
      photoIndex: (selectedPhoto.photoIndex + offset + photoCount) % photoCount,
    });
  }

  private getSelectedEvaluation(): PropertyEvaluation | null {
    const selectedPhoto = this.selectedPhoto();

    if (!selectedPhoto) {
      return null;
    }

    return this.evaluations().find((evaluation) => evaluation.id === selectedPhoto.evaluationId) ?? null;
  }
}
