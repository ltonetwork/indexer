import { IndexDocumentType } from './model/index.model';
import { Block } from '../transaction/interfaces/block.interface';

export interface IndexEventsReturnType {
  IndexTransaction: IndexDocumentType;
  IndexBlock: Block;
}

export const IndexEvent: { [P in keyof IndexEventsReturnType]: P } = {
  IndexTransaction: 'IndexTransaction',
  IndexBlock: 'IndexBlock',
};
