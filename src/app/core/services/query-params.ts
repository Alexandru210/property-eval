import { HttpParams } from '@angular/common/http';

type QueryValue = string | number | boolean | null | undefined;

export function buildHttpParams<T extends object>(filters: T): HttpParams {
  return Object.entries(filters as Record<string, QueryValue>).reduce((params, [key, value]) => {
    if (value === undefined || value === null || value === '') {
      return params;
    }

    return params.set(key, String(value));
  }, new HttpParams());
}
