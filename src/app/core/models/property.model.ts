export enum PropertyType {
  Apartment = 0,
  House = 1,
}

export enum ListingStatus {
  Active = 0,
  Inactive = 1,
  Expired = 2,
  Sold = 3,
}

export enum EvaluationStatus {
  Pending = 0,
  InProgress = 1,
  Completed = 2,
  Rejected = 3,
}

export interface SelectOption<T extends number> {
  value: T;
  label: string;
}

export const PROPERTY_TYPE_OPTIONS: Array<SelectOption<PropertyType>> = [
  { value: PropertyType.Apartment, label: 'Apartment' },
  { value: PropertyType.House, label: 'House' },
];

export const LISTING_STATUS_OPTIONS: Array<SelectOption<ListingStatus>> = [
  { value: ListingStatus.Active, label: 'Active' },
  { value: ListingStatus.Inactive, label: 'Inactive' },
  { value: ListingStatus.Expired, label: 'Expired' },
  { value: ListingStatus.Sold, label: 'Sold' },
];

export const EVALUATION_STATUS_OPTIONS: Array<SelectOption<EvaluationStatus>> = [
  { value: EvaluationStatus.Pending, label: 'Pending' },
  { value: EvaluationStatus.InProgress, label: 'In progress' },
  { value: EvaluationStatus.Completed, label: 'Completed' },
  { value: EvaluationStatus.Rejected, label: 'Rejected' },
];

export interface AddressRequest {
  street: string;
  city: string;
  county: string;
}

export interface AddressResponse extends AddressRequest {
  id: number;
}

export interface PropertyRecord {
  id: number;
  address: AddressResponse;
  propertyType: PropertyType;
  area: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  description: string;
  images: PropertyImage[];
  createdAt: string;
  updatedAt: string | null;
}

export interface PropertyImage {
  id: number;
  propertyId: number;
  imageUrl: string;
  description: string | null;
  uploadedAt: string;
}

export interface PropertyValuation {
  propertyId: number;
  predictedValue: number;
  predictionLowerBound: number;
  predictionUpperBound: number;
  trainingRowCount: number;
  rSquared: number;
  meanAbsoluteError: number;
  rootMeanSquaredError: number;
  modelName: string;
}

export interface CreatePropertyRequest {
  address: AddressRequest;
  propertyType: PropertyType;
  area: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  description: string;
}

export interface PropertyFilters {
  propertyType?: PropertyType;
  city?: string;
  county?: string;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  page?: number;
  pageSize?: number;
}

export interface PropertyListing {
  id: number;
  propertyId: number;
  userId: number;
  userFullName: string;
  title: string;
  askingPrice: number;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string | null;
  property: PropertyRecord;
}

export interface CreateListingRequest {
  propertyId: number;
  title: string;
  askingPrice: number;
  status: ListingStatus;
}

export interface ListingFilters {
  propertyId?: number;
  userId?: number;
  status?: ListingStatus;
  minAskingPrice?: number;
  maxAskingPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface PropertyEvaluation {
  id: number;
  propertyId: number;
  requestedByUserId: number;
  requestedByUserFullName: string;
  evaluatorUserId: number | null;
  evaluatorUserFullName: string | null;
  evaluatedValue: number;
  status: EvaluationStatus;
  notes: string | null;
  evaluationDate: string;
  createdAt: string;
  updatedAt: string | null;
  property: PropertyRecord;
}

export interface CreateEvaluationRequest {
  propertyId: number;
  notes?: string | null;
}

export interface EvaluationFilters {
  propertyId?: number;
  requestedByUserId?: number;
  evaluatorUserId?: number;
  status?: EvaluationStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

export function getPropertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Property';
}

export function getListingStatusLabel(status: ListingStatus): string {
  return LISTING_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Unknown';
}

export function getEvaluationStatusLabel(status: EvaluationStatus): string {
  return EVALUATION_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? 'Unknown';
}
