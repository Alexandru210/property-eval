import { buildHttpParams } from './query-params';

describe('buildHttpParams', () => {
  it('should skip empty values while preserving zero and false', () => {
    const params = buildHttpParams({
      city: 'Cluj-Napoca',
      empty: '',
      missing: undefined,
      none: null,
      page: 0,
      active: false,
    });

    expect(params.get('city')).toBe('Cluj-Napoca');
    expect(params.get('page')).toBe('0');
    expect(params.get('active')).toBe('false');
    expect(params.has('empty')).toBe(false);
    expect(params.has('missing')).toBe(false);
    expect(params.has('none')).toBe(false);
  });
});
