import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HERO_HOVER_CLEAR_DELAY_MS,
  createStableCardHoverSetter,
  isHeroCardWithinWrapper,
  isPointerInsideCardsWrapper,
} from '../src/components/hero/cardHover';

function makeFanTree() {
  const wrapper = {
    id: 'wrapper',
    className: 'cards-wrapper',
    contains(node: unknown) {
      return node === wrapper || node === card || node === cardChild || node === chrome;
    },
  };
  const card = {
    id: 'card',
    className: 'hero-card',
    closest(selector: string) {
      return selector === '.hero-card' ? card : null;
    },
  };
  const cardChild = {
    id: 'card-child',
    closest(selector: string) {
      return selector === '.hero-card' ? card : null;
    },
  };
  const chrome = {
    id: 'chrome',
    className: 'cinematic-filmstrip',
    closest(selector: string) {
      return null;
    },
  };
  const outside = {
    id: 'outside',
    closest() {
      return null;
    },
  };

  // Wrapper itself is not a hero card (empty fan space).
  (wrapper as { closest?: (selector: string) => unknown }).closest = (selector: string) =>
    selector === '.hero-card' ? null : null;

  return {
    wrapper: wrapper as unknown as Element,
    card: card as unknown as Element,
    cardChild: cardChild as unknown as Element,
    chrome: chrome as unknown as Element,
    outside: outside as unknown as Element,
  };
}

describe('isHeroCardWithinWrapper', () => {
  it('returns true for a hero card and its descendants', () => {
    const { wrapper, card, cardChild } = makeFanTree();
    expect(isHeroCardWithinWrapper(wrapper, card)).toBe(true);
    expect(isHeroCardWithinWrapper(wrapper, cardChild)).toBe(true);
  });

  it('returns false for bare wrapper, layout chrome, or outside', () => {
    const { wrapper, chrome, outside } = makeFanTree();
    expect(isHeroCardWithinWrapper(wrapper, wrapper)).toBe(false);
    expect(isHeroCardWithinWrapper(wrapper, chrome)).toBe(false);
    expect(isHeroCardWithinWrapper(wrapper, outside)).toBe(false);
    expect(isHeroCardWithinWrapper(wrapper, null)).toBe(false);
  });
});

describe('isPointerInsideCardsWrapper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns true when relatedTarget is inside a hero card', () => {
    const { wrapper, cardChild } = makeFanTree();
    expect(isPointerInsideCardsWrapper(wrapper, cardChild, 0, 0)).toBe(true);
  });

  it('probes elementFromPoint when relatedTarget is null and keeps hover on another card', () => {
    const { wrapper, card } = makeFanTree();
    const elementFromPoint = vi.fn(() => card);
    vi.stubGlobal('document', { elementFromPoint });

    expect(isPointerInsideCardsWrapper(wrapper, null, 12, 24)).toBe(true);
    expect(elementFromPoint).toHaveBeenCalledWith(12, 24);
  });

  it('clears when relatedTarget is null and the probe hits bare wrapper space', () => {
    const { wrapper } = makeFanTree();
    vi.stubGlobal('document', { elementFromPoint: vi.fn(() => wrapper) });
    expect(isPointerInsideCardsWrapper(wrapper, null, 1, 1)).toBe(false);
  });

  it('clears when relatedTarget is the wrapper or non-card chrome', () => {
    const { wrapper, chrome } = makeFanTree();
    expect(isPointerInsideCardsWrapper(wrapper, wrapper, 0, 0)).toBe(false);
    expect(isPointerInsideCardsWrapper(wrapper, chrome, 0, 0)).toBe(false);
  });

  it('returns false when the pointer has left the wrapper', () => {
    const { wrapper, outside } = makeFanTree();
    vi.stubGlobal('document', { elementFromPoint: vi.fn(() => outside) });
    expect(isPointerInsideCardsWrapper(wrapper, null, 1, 1)).toBe(false);
  });
});

describe('createStableCardHoverSetter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets hover immediately and delays clear', () => {
    vi.useFakeTimers();
    const setHoveredCard = vi.fn();
    const { onCardHover } = createStableCardHoverSetter(setHoveredCard, HERO_HOVER_CLEAR_DELAY_MS);

    onCardHover('config');
    expect(setHoveredCard).toHaveBeenCalledWith('config');

    onCardHover(null);
    expect(setHoveredCard).not.toHaveBeenCalledWith(null);

    vi.advanceTimersByTime(HERO_HOVER_CLEAR_DELAY_MS - 1);
    expect(setHoveredCard).not.toHaveBeenCalledWith(null);

    vi.advanceTimersByTime(1);
    expect(setHoveredCard).toHaveBeenCalledWith(null);
  });

  it('cancels a pending clear when another card is hovered', () => {
    vi.useFakeTimers();
    const setHoveredCard = vi.fn();
    const { onCardHover } = createStableCardHoverSetter(setHoveredCard, HERO_HOVER_CLEAR_DELAY_MS);

    onCardHover('config');
    onCardHover(null);
    onCardHover('hatch');
    vi.advanceTimersByTime(HERO_HOVER_CLEAR_DELAY_MS + 50);

    expect(setHoveredCard).toHaveBeenCalledWith('hatch');
    expect(setHoveredCard).not.toHaveBeenCalledWith(null);
  });
});
