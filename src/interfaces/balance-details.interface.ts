export interface BalanceDetails {
  readonly address: string;
  readonly regular: number;
  readonly available: number;
  readonly leasing: number;
  readonly unbonding: number;
  readonly effective: number;
  readonly generating: number;
}
