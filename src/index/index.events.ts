import type { Block } from '../interfaces/block.interface';
import { IndexDocumentType } from './model/index.model';

export interface IndexEventsReturnType {
  IndexTransaction: IndexDocumentType;
  IndexBlock: Block;
  InSync: number;
}

export const IndexEvent: { [P in keyof IndexEventsReturnType]: P } = {
  IndexTransaction: 'IndexTransaction',
  IndexBlock: 'IndexBlock',
  InSync: 'InSync',
};
