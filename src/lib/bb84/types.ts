export type Basis = 'Z' | 'X';
export type Bit = 0 | 1;

export interface QubitEvent {
  index: number;
  aliceBit: Bit;
  aliceBasis: Basis;
  state: string;
  eveIntercepted: boolean;
  eveBasis: Basis | null;
  eveBit: Bit | null;
  bobBasis: Basis;
  bobBit: Bit;
  sifted: boolean;
  error: boolean;
}

export interface SimulationResult {
  totalQubits: number;
  siftedKeyLength: number;
  eveCount: number;
  evePercentage: number;
  bitErrors: number;
  qber: number;
  noisePercentage: number;
  securityStatus: 'SECURE' | 'WARNING' | 'COMPROMISED';
  events: QubitEvent[];
  seed: number;
}

export interface ExperimentLog {
  id: string;
  timestamp: string;
  qubits: number;
  eveProbability: number;
  noise: number;
  seed: number;
  qber: number;
  siftedKeyLength: number;
  detectionResult: string;
}
