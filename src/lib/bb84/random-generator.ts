// Seedable LCG random number generator
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextBit(): 0 | 1 {
    return this.next() < 0.5 ? 0 : 1;
  }

  nextBasis(): 'Z' | 'X' {
    return this.next() < 0.5 ? 'Z' : 'X';
  }

  nextBool(probability: number): boolean {
    return this.next() < probability;
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 999999) + 1;
}
