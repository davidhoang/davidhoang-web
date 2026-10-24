import { describe, expect, it } from 'vitest';
import { resolveOpenGraphVideo } from '../src/utils/ogVideo';

const SITE = 'https://www.davidhoang.com';

describe('resolveOpenGraphVideo', () => {
  it('uses video/mp4 for direct MP4 assets', () => {
    const meta = resolveOpenGraphVideo('/images/davidhoang-web-config.mp4', SITE, {
      width: 600,
      height: 338,
    });
    expect(meta).toEqual({
      url: `${SITE}/images/davidhoang-web-config.mp4`,
      type: 'video/mp4',
      width: 600,
      height: 338,
    });
  });

  it('uses text/html for YouTube embed URLs', () => {
    const meta = resolveOpenGraphVideo(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      SITE,
    );
    expect(meta.type).toBe('text/html');
    expect(meta.url).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(meta.width).toBe(1280);
    expect(meta.height).toBe(720);
  });
});
