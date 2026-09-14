import type { Bit, Basis, QubitEvent, SimulationResult } from './types';
import { SeededRandom } from './random-generator';
import { getStateName, measureInBasis } from './quantum-states';

export function runBB84(
  numQubits: number,
  eveProbability: number,  // 0 to 1
  noiseLevel: number,       // 0 to 1
  seed: number
): SimulationResult {
  const rng = new SeededRandom(seed);
  const events: QubitEvent[] = [];

  for (let i = 0; i < numQubits; i++) {
    const aliceBit = rng.nextBit();
    const aliceBasis = rng.nextBasis();
    const state = getStateName(aliceBit, aliceBasis);

    // Eve intercepts
    const eveIntercepted = rng.nextBool(eveProbability);
    let eveBasis: Basis | null = null;
    let eveBit: Bit | null = null;
    let transmittedBit = aliceBit;
    let transmittedBasis = aliceBasis;

    if (eveIntercepted) {
      eveBasis = rng.nextBasis();
      eveBit = measureInBasis(aliceBit, aliceBasis, eveBasis, rng.next());
      // Eve re-encodes — disturbs state if wrong basis
      transmittedBit = eveBit;
      transmittedBasis = eveBasis;
    }

    // Channel noise
    const noisyBit: Bit = rng.nextBool(noiseLevel)
      ? ((transmittedBit === 0 ? 1 : 0) as Bit)
      : transmittedBit;

    // Bob measures
    const bobBasis = rng.nextBasis();
    const bobBit = measureInBasis(noisyBit, transmittedBasis, bobBasis, rng.next());

    // Sifting
    const sifted = aliceBasis === bobBasis;
    const error = sifted && bobBit !== aliceBit;

    events.push({
      index: i + 1,
      aliceBit, aliceBasis, state,
      eveIntercepted, eveBasis, eveBit,
      bobBasis, bobBit: bobBit as Bit,
      sifted, error
    });
  }

  const siftedEvents = events.filter(e => e.sifted);
  const siftedKeyLength = siftedEvents.length;
  const bitErrors = siftedEvents.filter(e => e.error).length;
  const eveCount = events.filter(e => e.eveIntercepted).length;
  const qber = siftedKeyLength > 0 ? (bitErrors / siftedKeyLength) * 100 : 0;

  const securityStatus =
    qber > 20 ? 'COMPROMISED' :
    qber > 11 ? 'WARNING' : 'SECURE';

  return {
    totalQubits: numQubits,
    siftedKeyLength,
    eveCount,
    evePercentage: (eveCount / numQubits) * 100,
    bitErrors,
    qber,
    noisePercentage: noiseLevel * 100,
    securityStatus,
    events,
    seed
  };
}

export function runMultipleSimulations(
  numQubits: number,
  eveProbability: number,
  noiseLevel: number,
  count: number,
  baseSeed: number
): SimulationResult[] {
  return Array.from({ length: count }, (_, i) =>
    runBB84(numQubits, eveProbability, noiseLevel, baseSeed + i)
  );
}
