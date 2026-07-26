import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  HERO_HOVER_CLEAR_DELAY_MS,
  createStableCardHoverSetter,
  isPointerInsideCardsWrapper,
} from '../src/components/hero/cardHover';

describe('isPointerInsideCardsWrapper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when relatedTarget is inside the wrapper', () => {
    const wrapper = document.createElement('div');
    const child = document.createElement('button');
    wrapper.appendChild(child);
    expect(isPointerInsideCardsWrapper(wrapper, child, 0, 0)).toBe(true);
  });

  it('probes elementFromPoint when relatedTarget is null', () => {
    const wrapper = document.createElement('div');
    const child = document.createElement('button');
    wrapper.appendChild(child);
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(child);
    expect(isPointerInsideCardsWrapper(wrapper, null, 12, 24)).toBe(true);
    expect(document.elementFromPoint).toHaveBeenCalledWith(12, 24);
  });

  it('returns false when the pointer has left the wrapper', () => {
    const wrapper = document.createElement('div');
    vi.spyOn(document, 'elementFromPoint').mockReturnValue(document.body);
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
