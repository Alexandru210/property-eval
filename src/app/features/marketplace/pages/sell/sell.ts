import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LISTING_STATUS_OPTIONS,
  ListingStatus,
  PROPERTY_TYPE_OPTIONS,
  PropertyListing,
  PropertyType,
} from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';
import { PropertyService } from '../../../../core/services/property.service';

type SellControlName =
  | 'street'
  | 'city'
  | 'county'
  | 'propertyType'
  | 'area'
  | 'bedrooms'
  | 'bathrooms'
  | 'yearBuilt'
  | 'description'
  | 'title'
  | 'askingPrice'
  | 'status';

@Component({
  selector: 'app-sell',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './sell.html',
  styleUrl: './sell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sell {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly listingService = inject(ListingService);

  protected readonly propertyTypes = PROPERTY_TYPE_OPTIONS;
  protected readonly listingStatuses = LISTING_STATUS_OPTIONS.filter(
    (status) => status.value === ListingStatus.Active || status.value === ListingStatus.Inactive,
  );
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly createdListing = signal<PropertyListing | null>(null);
  protected readonly pendingPropertyId = signal<number | null>(null);
  private readonly pendingPropertySignature = signal<string | null>(null);

  protected readonly sellForm = this.fb.group({
    street: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', [Validators.required, Validators.maxLength(80)]],
    county: ['', [Validators.required, Validators.maxLength(80)]],
    propertyType: [PropertyType.Apartment, [Validators.required]],
    area: [50, [Validators.required, Validators.min(1)]],
    bedrooms: [1, [Validators.required, Validators.min(0)]],
    bathrooms: [1, [Validators.required, Validators.min(0)]],
    yearBuilt: [2020, [Validators.required, Validators.min(1800), Validators.max(2027)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    askingPrice: [100000, [Validators.required, Validators.min(1)]],
    status: [ListingStatus.Active, [Validators.required]],
  });

  protected async submit(): Promise<void> {
    this.submitError.set(null);
    this.createdListing.set(null);

    if (this.sellForm.invalid) {
      this.sellForm.markAllAsTouched();
      return;
    }

    const formValue = this.sellForm.getRawValue();
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

      const listing = await this.listingService.createListing({
        propertyId,
        title: formValue.title.trim(),
        askingPrice: Number(formValue.askingPrice),
        status: Number(formValue.status) as ListingStatus,
      });

      this.createdListing.set(listing);
      this.pendingPropertyId.set(null);
      this.pendingPropertySignature.set(null);
      this.sellForm.markAsPristine();
    } catch (error) {
      this.submitError.set(this.getSubmitErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected hasError(controlName: SellControlName, errorName: string): boolean {
    const control = this.sellForm.controls[controlName];
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
      return 'The property details were saved, but the listing could not be published. Retry to continue from the saved details.';
    }

    return 'The listing could not be created. Please review the form and try again.';
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
