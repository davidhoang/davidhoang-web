import { describe, expect, it } from 'vitest';
import {
  isAuthorized,
  stripHtmlComments,
} from '../../src/pages/api/bio-summary-helpers';

describe('stripHtmlComments', () => {
  it('removes single-line comments', () => {
    expect(stripHtmlComments('before <!-- hi --> after')).toBe('before  after');
  });

  it('removes multi-line comments', () => {
    const input = `one
<!-- hidden
over multiple
lines -->
two`;
    expect(stripHtmlComments(input)).toBe(`one\n\ntwo`);
  });

  it('removes multiple comments in the same string', () => {
    expect(stripHtmlComments('a<!--1-->b<!--2-->c')).toBe('abc');
  });

  it('trims surrounding whitespace', () => {
    expect(stripHtmlComments('   <!-- hi -->   ')).toBe('');
  });

  it('returns non-comment content untouched', () => {
    expect(stripHtmlComments('# heading\n\nbody')).toBe('# heading\n\nbody');
  });
});

describe('isAuthorized', () => {
  it('allows any request when no expected token is configured', () => {
    expect(isAuthorized(null, undefined)).toBe(true);
    expect(isAuthorized('Bearer anything', '')).toBe(true);
    expect(isAuthorized(null, null)).toBe(true);
  });

  it('accepts an exact Bearer match', () => {
    expect(isAuthorized('Bearer s3cret', 's3cret')).toBe(true);
  });

  it('rejects missing or mismatched headers', () => {
    expect(isAuthorized(null, 's3cret')).toBe(false);
    expect(isAuthorized('', 's3cret')).toBe(false);
    expect(isAuthorized('Bearer wrong', 's3cret')).toBe(false);
    expect(isAuthorized('s3cret', 's3cret')).toBe(false); // missing "Bearer "
    expect(isAuthorized('bearer s3cret', 's3cret')).toBe(false); // case-sensitive
  });
});
