import { environment } from '../../../environments/environment';
import { resolveApiImageUrl } from './image-url';

describe('resolveApiImageUrl', () => {
  it('should leave absolute, data, and blob image URLs unchanged', () => {
    expect(resolveApiImageUrl('https://cdn.example.com/front.jpg')).toBe('https://cdn.example.com/front.jpg');
    expect(resolveApiImageUrl('http://cdn.example.com/front.jpg')).toBe('http://cdn.example.com/front.jpg');
    expect(resolveApiImageUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(resolveApiImageUrl('blob:https://example.com/abc')).toBe('blob:https://example.com/abc');
  });

  it('should resolve API-relative image URLs against the API host', () => {
    expect(resolveApiImageUrl('/images/front.jpg')).toBe(`${environment.apiUrl}/images/front.jpg`);
    expect(resolveApiImageUrl('images/front.jpg')).toBe(`${environment.apiUrl}/images/front.jpg`);
  });
});
