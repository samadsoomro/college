import type { Bit, Basis } from './types';

export function getStateName(bit: Bit, basis: Basis): string {
  if (basis === 'Z') return bit === 0 ? '|0⟩' : '|1⟩';
  return bit === 0 ? '|+⟩' : '|-⟩';
}

export function measureInBasis(bit: Bit, encodedBasis: Basis, measBasis: Basis, rand: number): Bit {
  if (encodedBasis === measBasis) return bit;
  // Wrong basis: 50/50 random outcome
  return rand < 0.5 ? 0 : 1;
}
