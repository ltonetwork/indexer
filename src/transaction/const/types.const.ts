export const ALL_TX = { id: 'all', types: [1, 4, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19] };
export const ANCHOR_TX = { id: 'anchor', types: [12, 15] };
export const TRANSFER_TX = { id: 'transfer', types: [4] };
export const MASS_TRANSFER_TX = { id: 'mass_transfer', types: [11] };
export const ALL_TRANSFER_TX = { id: 'all_transfers', types: [4, 11] };
export const START_LEASE_TX = { id: 'start_lease', types: [8] };   // Deprecated
export const CANCEL_LEASE_TX = { id: 'cancel_lease', types: [9] }; // Deprecated
export const LEASE_TX = { id: 'lease', types: [8, 9] };
export const ASSOCIATION_TX = { id: 'association', types: [16, 17] };
export const SCRIPT_TX = { id: 'script', types: [13] };
export const SPONSOR_TX = { id: 'sponsor', types: [18, 19] };

export default {
  ANCHOR_TX,
  TRANSFER_TX,
  MASS_TRANSFER_TX,
  ALL_TRANSFER_TX,
  START_LEASE_TX,
  CANCEL_LEASE_TX,
  LEASE_TX,
  ASSOCIATION_TX,
  SCRIPT_TX,
  SPONSOR_TX,
  ALL_TX,
};
