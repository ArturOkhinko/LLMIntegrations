export type CostSource = 'provider' | 'calculated';

export interface Cost {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  source: CostSource;
}
