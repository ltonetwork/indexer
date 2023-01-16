import { IndexDocumentType } from './model/index.model';
import {Block} from '../interfaces/block.interface';

export interface IndexEventsReturnType {
  IndexTransaction: IndexDocumentType;
  IndexBlock: Block;
  IndexSync: number;
}

export const IndexEvent: { [P in keyof IndexEventsReturnType]: P } = {
  IndexTransaction: 'IndexTransaction',
  IndexBlock: 'IndexBlock',
  IndexSync: 'IndexSync',
};
