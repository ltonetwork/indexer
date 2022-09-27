export const ALL_TX = { id: 'all' };
export const ANCHOR_TX = { id: 'anchor', types: [15, 22] };
export const TRANSFER_TX = { id: 'transfer', types: [4] };
export const MASS_TRANSFER_TX = { id: 'mass_transfer', types: [11] };
export const BURN_TX = { id: 'burn', types: [21] };
export const ALL_TRANSFER_TX = { id: 'all_transfers', types: [4, 11, 21] };
export const LEASE_TX = { id: 'lease', types: [8, 9] };
export const ASSOCIATION_TX = { id: 'association', types: [16, 17] };
export const SCRIPT_TX = { id: 'script', types: [13] };
export const SPONSOR_TX = { id: 'sponsor', types: [18, 19] };
export const DATA_TX = { id: 'data', types: [12] };
export const STATEMENT_TX = { id: 'statement', types: [23] };

export default {
  ANCHOR_TX,
  TRANSFER_TX,
  MASS_TRANSFER_TX,
  BURN_TX,
  ALL_TRANSFER_TX,
  LEASE_TX,
  ASSOCIATION_TX,
  SCRIPT_TX,
  SPONSOR_TX,
  DATA_TX,
  STATEMENT_TX,
  ALL_TX,
};
