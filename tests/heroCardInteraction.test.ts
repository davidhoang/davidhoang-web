import { describe, expect, it } from 'vitest';
import {
  applyHeroCardPhaseMotion,
  heroCardInteractionTransition,
  HERO_INTERACTION_SPRING,
  HERO_PRESS_SPRING,
  resolveHeroCardFocus,
  resolveHeroCardPhase,
} from '../src/components/hero/heroCardInteraction';

describe('resolveHeroCardPhase', () => {
  it('prioritizes selected over press/focus/dimmed', () => {
    expect(
      resolveHeroCardPhase({
        isLoaded: true,
        isSelected: true,
        isOtherSelected: false,
        isFocused: true,
        isPressed: true,
      })
    ).toBe('selected');
  });

  it('uses dimmed when another card is selected', () => {
    expect(
      resolveHeroCardPhase({
        isLoaded: true,
        isSelected: false,
        isOtherSelected: true,
        isFocused: true,
        isPressed: true,
      })
    ).toBe('dimmed');
  });

  it('uses pressed over focused', () => {
    expect(
      resolveHeroCardPhase({
        isLoaded: true,
        isSelected: false,
        isOtherSelected: false,
        isFocused: true,
        isPressed: true,
      })
    ).toBe('pressed');
  });

  it('returns entering before load', () => {
    expect(
      resolveHeroCardPhase({
        isLoaded: false,
        isSelected: false,
        isOtherSelected: false,
        isFocused: true,
        isPressed: false,
      })
    ).toBe('entering');
  });
});

describe('resolveHeroCardFocus', () => {
  it('allows keyboard focus when pointer hover is disabled (iPad + Magic Keyboard)', () => {
    expect(
      resolveHeroCardFocus({
        hoverDisabled: false,
        pointerHoverDisabled: true,
        isOtherSelected: false,
        isHovered: true,
        isKeyboardFocused: true,
      })
    ).toBe(true);
  });

  it('ignores hoveredCard when pointer hover is disabled', () => {
    expect(
      resolveHeroCardFocus({
        hoverDisabled: false,
        pointerHoverDisabled: true,
        isOtherSelected: false,
        isHovered: true,
        isKeyboardFocused: false,
      })
    ).toBe(false);
  });

  it('suppresses keyboard and pointer focus when hoverDisabled', () => {
    expect(
      resolveHeroCardFocus({
        hoverDisabled: true,
        pointerHoverDisabled: false,
        isOtherSelected: false,
        isHovered: true,
        isKeyboardFocused: true,
      })
    ).toBe(false);
  });

  it('keeps pointer hover when enabled', () => {
    expect(
      resolveHeroCardFocus({
        hoverDisabled: false,
        pointerHoverDisabled: false,
        isOtherSelected: false,
        isHovered: true,
        isKeyboardFocused: false,
      })
    ).toBe(true);
  });
});

describe('applyHeroCardPhaseMotion', () => {
  const rest = { x: 10, y: 20, scale: 1, opacity: 1 };

  it('keeps press on the focused baseline so click does not snap through rest', () => {
    expect(
      applyHeroCardPhaseMotion('pressed', rest, {
        focused: { y: 12, scale: 1.02 },
        pressed: { scale: 0.99 },
      })
    ).toEqual({ x: 10, y: 12, scale: 0.99, opacity: 1 });
  });

  it('ignores focus lift while dimmed', () => {
    expect(
      applyHeroCardPhaseMotion('dimmed', rest, {
        focused: { y: 12, scale: 1.02 },
        dimmed: { opacity: 0.3 },
      })
    ).toEqual({ x: 10, y: 20, scale: 1, opacity: 0.3 });
  });

  it('applies selected overrides from rest', () => {
    expect(
      applyHeroCardPhaseMotion('selected', rest, {
        focused: { scale: 1.02 },
        selected: { x: 0, y: -40, scale: 1.15 },
      })
    ).toEqual({ x: 0, y: -40, scale: 1.15, opacity: 1 });
  });
});

describe('heroCardInteractionTransition', () => {
  const entrance = { stiffness: 80, damping: 16, staggerDelay: 0.08 };

  it('uses entrance spring before hasAnimatedIn', () => {
    const t = heroCardInteractionTransition({
      hasAnimatedIn: false,
      phase: 'rest',
      index: 2,
      isLoaded: true,
      entrance,
    });
    expect(t).toMatchObject({
      type: 'spring',
      stiffness: 80,
      damping: 16,
      delay: 0.16,
    });
  });

  it('uses press spring while pressed after entrance', () => {
    expect(
      heroCardInteractionTransition({
        hasAnimatedIn: true,
        phase: 'pressed',
        index: 0,
        isLoaded: true,
        entrance,
      })
    ).toEqual(HERO_PRESS_SPRING);
  });

  it('uses interaction spring for focus/rest/dimmed after entrance', () => {
    expect(
      heroCardInteractionTransition({
        hasAnimatedIn: true,
        phase: 'focused',
        index: 0,
        isLoaded: true,
        entrance,
      })
    ).toEqual(HERO_INTERACTION_SPRING);
  });
});
