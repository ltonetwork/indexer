import { Transaction } from '../../transaction/interfaces/transaction.interface';

export class IndexDocumentType {
  transaction: Transaction;
  blockHeight: number;
  position: number;
}
