import { describe, expect, it } from 'vitest';
import { fanCardMotion } from '../src/components/hero/fanCardMotion';
import { heroDialDefaults } from '../src/components/hero/heroDialDefaults';

const hover = heroDialDefaults.stackedFan.hover;
const position = { x: 80, y: 5, rotation: 2 };

describe('fan card motion', () => {
  it('returns to the original fan pose when focus clears', () => {
    expect(fanCardMotion({ index: 3, focusedIndex: null, position, hover })).toEqual({
      x: position.x, y: position.y, rotate: position.rotation, scale: 1,
    });
  });

  it('pulls the focused card up and outward while gently straightening it', () => {
    const pose = fanCardMotion({ index: 3, focusedIndex: 3, position, hover });
    expect(pose.x).toBeGreaterThan(position.x);
    expect(pose.y).toBeLessThan(position.y);
    expect(pose.rotate).toBeGreaterThan(0);
    expect(pose.rotate).toBeLessThan(position.rotation);
    expect(pose.scale).toBeGreaterThan(1);
  });

  it('mirrors the pull across the middle of the fan', () => {
    const right = fanCardMotion({ index: 3, focusedIndex: 3, position, hover });
    const left = fanCardMotion({
      index: 2, focusedIndex: 2,
      position: { x: -position.x, y: position.y, rotation: -position.rotation }, hover,
    });
    expect(left.x).toBe(-right.x);
    expect(left.rotate).toBe(-right.rotate);
    expect(left.y).toBe(right.y);
  });

  it('moves neighbors away from the focused card without changing their scale', () => {
    const left = fanCardMotion({ index: 2, focusedIndex: 3, position, hover });
    const right = fanCardMotion({ index: 4, focusedIndex: 3, position, hover });
    expect(left.x).toBeLessThan(position.x);
    expect(right.x).toBeGreaterThan(position.x);
    expect(left.scale).toBe(1);
    expect(right.scale).toBe(1);
  });

  it('limits the response of distant cards so the whole deck does not jump', () => {
    const near = fanCardMotion({ index: 4, focusedIndex: 3, position, hover });
    const far = fanCardMotion({ index: 5, focusedIndex: 3, position, hover });
    expect(far.x - position.x).toBeGreaterThan(0);
    expect(far.x - position.x).toBeLessThan((near.x - position.x) / 2);
  });

  it('opens more space between the active card and its occluding neighbor', () => {
    const leftPosition = { x: -80, y: 5, rotation: -2 };
    const left = fanCardMotion({ index: 2, focusedIndex: 3, position: leftPosition, hover });
    const active = fanCardMotion({ index: 3, focusedIndex: 3, position, hover });
    expect(active.x - left.x).toBeGreaterThan(heroDialDefaults.card.width * active.scale);
  });
});
