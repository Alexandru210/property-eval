import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PROPERTY_TYPE_OPTIONS,
  PropertyEvaluation,
  PropertyType,
  PropertyValuation,
} from '../../../../core/models/property.model';
import { EvaluationService } from '../../../../core/services/evaluation.service';
import { PropertyService } from '../../../../core/services/property.service';

type EvaluationControlName =
  | 'street'
  | 'city'
  | 'county'
  | 'propertyType'
  | 'area'
  | 'bedrooms'
  | 'bathrooms'
  | 'yearBuilt'
  | 'description'
  | 'notes';

@Component({
  selector: 'app-evaluate',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './evaluate.html',
  styleUrl: './evaluate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Evaluate {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly evaluationService = inject(EvaluationService);

  protected readonly propertyTypes = PROPERTY_TYPE_OPTIONS;
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly createdEvaluation = signal<PropertyEvaluation | null>(null);
  protected readonly propertyValuation = signal<PropertyValuation | null>(null);
  protected readonly valuationError = signal<string | null>(null);
  protected readonly pendingPropertyId = signal<number | null>(null);
  private readonly pendingPropertySignature = signal<string | null>(null);

  protected readonly evaluationForm = this.fb.group({
    street: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    county: ['', [Validators.required, Validators.maxLength(80)]],
    propertyType: [PropertyType.Apartment, [Validators.required]],
    area: [50, [Validators.required, Validators.min(1)]],
    bedrooms: [1, [Validators.required, Validators.min(0)]],
    bathrooms: [1, [Validators.required, Validators.min(0)]],
    yearBuilt: [2020, [Validators.required, Validators.min(1800), Validators.max(2027)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  protected async submit(): Promise<void> {
    this.submitError.set(null);
    this.createdEvaluation.set(null);
    this.propertyValuation.set(null);
    this.valuationError.set(null);

    if (this.evaluationForm.invalid) {
      this.evaluationForm.markAllAsTouched();
      return;
    }

    const formValue = this.evaluationForm.getRawValue();
    const propertyRequest = {
      address: {
        street: formValue.street.trim(),
        city: formValue.city.trim(),
        county: formValue.county.trim(),
      },
      propertyType: Number(formValue.propertyType) as PropertyType,
      area: Number(formValue.area),
      bedrooms: Number(formValue.bedrooms),
      bathrooms: Number(formValue.bathrooms),
      yearBuilt: Number(formValue.yearBuilt),
      description: formValue.description.trim(),
    };
    const propertySignature = JSON.stringify(propertyRequest);

    this.isSubmitting.set(true);

    try {
      let propertyId = this.pendingPropertyId();

      if (propertyId !== null && this.pendingPropertySignature() !== propertySignature) {
        propertyId = null;
        this.pendingPropertyId.set(null);
        this.pendingPropertySignature.set(null);
      }

      if (propertyId === null) {
        const property = await this.propertyService.createProperty(propertyRequest);
        propertyId = property.id;
        this.pendingPropertyId.set(propertyId);
        this.pendingPropertySignature.set(propertySignature);
      }

      const evaluation = await this.evaluationService.createEvaluation({
        propertyId,
        notes: formValue.notes.trim() || null,
      });

      this.createdEvaluation.set(evaluation);
      this.pendingPropertyId.set(null);
      this.pendingPropertySignature.set(null);
      this.evaluationForm.markAsPristine();
      await this.loadValuation(propertyId);
    } catch (error) {
      this.submitError.set(this.getSubmitErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected hasError(controlName: EvaluationControlName, errorName: string): boolean {
    const control = this.evaluationForm.controls[controlName];
    return control.hasError(errorName) && (control.dirty || control.touched);
  }

  private getSubmitErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = this.extractBackendMessage(error);

      if (backendMessage) {
        return backendMessage;
      }

      if (error.status === 0) {
        return 'Could not reach the server. Please check your connection and try again.';
      }
    }

    if (this.pendingPropertyId() !== null) {
      return 'The property details were saved, but the evaluation request could not be submitted. Retry to continue from the saved details.';
    }

    return 'The evaluation request could not be created. Please review the form and try again.';
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

  private async loadValuation(propertyId: number): Promise<void> {
    try {
      this.propertyValuation.set(await this.propertyService.getPropertyValuation(propertyId));
    } catch {
      this.valuationError.set('The evaluation request was created, but the instant valuation could not be calculated right now.');
    }
  }
}
