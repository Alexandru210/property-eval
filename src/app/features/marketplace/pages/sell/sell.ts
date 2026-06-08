import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LISTING_STATUS_OPTIONS,
  ListingStatus,
  PROPERTY_TYPE_OPTIONS,
  PropertyType,
} from '../../../../core/models/property.model';
import { ListingService } from '../../../../core/services/listing.service';
import { PropertyService } from '../../../../core/services/property.service';

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

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
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sell.html',
  styleUrl: './sell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sell implements OnDestroy {
  protected readonly acceptedImageTypes = 'image/jpeg,image/png,image/webp';
  protected readonly maxImageCount = 10;
  protected readonly maxImageSizeLabel = '5 MB';

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly propertyService = inject(PropertyService);
  private readonly listingService = inject(ListingService);
  private readonly router = inject(Router);

  protected readonly propertyTypes = PROPERTY_TYPE_OPTIONS;
  protected readonly listingStatuses = LISTING_STATUS_OPTIONS.filter(
    (status) => status.value === ListingStatus.Active || status.value === ListingStatus.Inactive,
  );
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly photoError = signal<string | null>(null);
  protected readonly selectedImages = signal<SelectedImage[]>([]);
  protected readonly pendingPropertyId = signal<number | null>(null);
  private readonly pendingPropertySignature = signal<string | null>(null);
  private readonly pendingImageSignature = signal<string | null>(null);

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

  ngOnDestroy(): void {
    this.revokeSelectedImages();
  }

  protected onImageSelection(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    input.value = '';
    this.photoError.set(null);

    if (files.length === 0) {
      return;
    }

    const validationError = this.getImageValidationError(files);

    if (validationError) {
      this.photoError.set(validationError);
      return;
    }

    this.selectedImages.set([
      ...this.selectedImages(),
      ...files.map((file) => ({
        id: this.createImageId(),
        file,
        previewUrl: this.createPreviewUrl(file),
      })),
    ]);
  }

  protected removeSelectedImage(imageId: string): void {
    const image = this.selectedImages().find((selectedImage) => selectedImage.id === imageId);

    if (image) {
      this.revokePreviewUrl(image.previewUrl);
    }

    this.selectedImages.set(
      this.selectedImages().filter((selectedImage) => selectedImage.id !== imageId),
    );
    this.photoError.set(null);
  }

  protected async submit(): Promise<void> {
    this.submitError.set(null);

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
    const imageSignature = this.getImageSignature();
    const propertySignature = JSON.stringify({ property: propertyRequest, images: imageSignature });

    this.isSubmitting.set(true);

    try {
      let propertyId = this.pendingPropertyId();

      if (propertyId !== null && this.pendingPropertySignature() !== propertySignature) {
        propertyId = null;
        this.pendingPropertyId.set(null);
        this.pendingPropertySignature.set(null);
        this.pendingImageSignature.set(null);
      }

      if (propertyId === null) {
        const property = await this.propertyService.createProperty(propertyRequest);
        propertyId = property.id;
        this.pendingPropertyId.set(propertyId);
        this.pendingPropertySignature.set(propertySignature);
      }

      if (this.pendingImageSignature() !== imageSignature) {
        const files = this.selectedImages().map((image) => image.file);

        if (files.length > 0) {
          await this.propertyService.uploadPropertyImages(propertyId, files);
        }

        this.pendingImageSignature.set(imageSignature);
      }

      const listing = await this.listingService.createListing({
        propertyId,
        title: formValue.title.trim(),
        askingPrice: Number(formValue.askingPrice),
        status: Number(formValue.status) as ListingStatus,
      });

      this.pendingPropertyId.set(null);
      this.pendingPropertySignature.set(null);
      this.pendingImageSignature.set(null);
      this.clearSelectedImages();
      this.sellForm.markAsPristine();
      await this.router.navigate(['/listings', listing.id]);
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

  private getImageValidationError(files: File[]): string | null {
    if (this.selectedImages().length + files.length > this.maxImageCount) {
      return `Select up to ${this.maxImageCount} photos.`;
    }

    for (const file of files) {
      if (!this.acceptedImageTypes.split(',').includes(file.type)) {
        return `${file.name} must be a JPG, PNG, or WebP image.`;
      }

      if (file.size > 5 * 1024 * 1024) {
        return `${file.name} must be ${this.maxImageSizeLabel} or smaller.`;
      }
    }

    return null;
  }

  private getImageSignature(): string {
    return JSON.stringify(
      this.selectedImages().map((image) => ({
        name: image.file.name,
        size: image.file.size,
        type: image.file.type,
        lastModified: image.file.lastModified,
      })),
    );
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

  private clearSelectedImages(): void {
    this.revokeSelectedImages();
    this.selectedImages.set([]);
    this.photoError.set(null);
  }

  private revokeSelectedImages(): void {
    for (const image of this.selectedImages()) {
      this.revokePreviewUrl(image.previewUrl);
    }
  }

  private createPreviewUrl(file: File): string {
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      return URL.createObjectURL(file);
    }

    return '';
  }

  private revokePreviewUrl(previewUrl: string): void {
    if (previewUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(previewUrl);
    }
  }

  private createImageId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
  }
}
