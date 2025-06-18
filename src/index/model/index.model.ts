import type { Transaction } from '../../interfaces/transaction.interface';

export class IndexDocumentType {
  transaction: Transaction;
  blockHeight: number;
  position: number;
}
