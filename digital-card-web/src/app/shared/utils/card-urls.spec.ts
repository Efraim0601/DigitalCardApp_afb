import { buildPublicCardUrl, withEmployeeQuery } from './card-urls';

describe('card-urls utils', () => {
  describe('buildPublicCardUrl', () => {
    it('returns origin+path when query is empty', () => {
      expect(buildPublicCardUrl('https://x.com', '/card', {})).toBe('https://x.com/card');
    });

    it('skips null/undefined values', () => {
      const url = buildPublicCardUrl('https://x.com', '/c', {
        email: null,
        other: undefined,
        a: 'b'
      });
      expect(url).toBe('https://x.com/c?a=b');
    });

    it('uses first element for array values', () => {
      const url = buildPublicCardUrl('https://x.com', '/c', { k: ['v1', 'v2'] });
      expect(url).toBe('https://x.com/c?k=v1');
    });

    it('ignores empty-string array first element', () => {
      const url = buildPublicCardUrl('https://x.com', '/c', { k: [''] });
      expect(url).toBe('https://x.com/c');
    });

    it('removes owner and employee params', () => {
      const url = buildPublicCardUrl('https://x.com', '/c', {
        owner: '1',
        employee: '1',
        email: 'a@b.c'
      });
      expect(url).toBe('https://x.com/c?email=a%40b.c');
    });
  });

  describe('withEmployeeQuery', () => {
    it('returns empty string for empty input', () => {
      expect(withEmployeeQuery('')).toBe('');
    });

    it('appends with ? when no query', () => {
      expect(withEmployeeQuery('https://x.com/c')).toBe('https://x.com/c?employee=1');
    });

    it('appends with & when already has query', () => {
      expect(withEmployeeQuery('https://x.com/c?a=1')).toBe('https://x.com/c?a=1&employee=1');
    });
  });
});
