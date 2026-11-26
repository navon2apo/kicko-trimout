// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, expect, it } from 'vitest';

import { nameWithoutNumber, splitClipName } from './lockTitle';

describe('the lock title taken from the clip name', () => {
  it('drops the running number at the end', () => {
    expect(nameWithoutNumber('דין עישת Through ball 1')).toBe('דין עישת Through ball');
    expect(nameWithoutNumber('Distribution 12')).toBe('Distribution');
  });
  it('keeps a name without a number and gives empty for no name', () => {
    expect(nameWithoutNumber('Free kick')).toBe('Free kick');
    expect(nameWithoutNumber(undefined)).toBe('');
    expect(nameWithoutNumber('  ')).toBe('');
  });
});

describe('splitting a clip name into player and move', () => {
  it('takes the leading non-English words as the player and the English rest as the move', () => {
    expect(splitClipName('דין עישת Through ball 1')).toEqual({ player: 'דין עישת', action: 'Through ball' });
    expect(splitClipName('דין shot on goal 2')).toEqual({ player: 'דין', action: 'shot on goal' });
  });
  it('does not split when there is no such pattern', () => {
    expect(splitClipName('Through ball 1')).toEqual({ player: '', action: 'Through ball' });
    expect(splitClipName('דין עישת 3')).toEqual({ player: '', action: 'דין עישת' });
    expect(splitClipName(undefined)).toEqual({ player: '', action: '' });
  });
});
