import { environment } from '../../../environments/environment';

export function resolveApiImageUrl(imageUrl: string): string {
  if (/^(https?:|data:|blob:)/i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.startsWith('/')) {
    return `${environment.apiUrl}${imageUrl}`;
  }

  return `${environment.apiUrl}/${imageUrl}`;
}
