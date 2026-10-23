import { describe, it, expect } from 'vitest';
import { xPostStatusUrl } from '../src/utils/xPost';

describe('xPostStatusUrl', () => {
  it('builds an x.com status URL from handle and id', () => {
    expect(xPostStatusUrl('60Minutes', '1614785392456105985')).toBe(
      'https://x.com/60Minutes/status/1614785392456105985',
    );
  });

  it('strips a leading @ from the handle', () => {
    expect(xPostStatusUrl('@60Minutes', '1614785392456105985')).toBe(
      'https://x.com/60Minutes/status/1614785392456105985',
    );
  });

  it('throws when handle or id is missing', () => {
    expect(() => xPostStatusUrl('', '123')).toThrow();
    expect(() => xPostStatusUrl('user', '')).toThrow();
  });
});
