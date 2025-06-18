import { IndexDocumentType } from './model/index.model';
import { Block } from '../interfaces/block.interface';

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
