import { IndexDocumentType } from './model/index.model';

export interface IndexEventsReturnType {
  IndexTransaction: IndexDocumentType;
  IndexBlock: number;
}

export const IndexEvent: { [P in keyof IndexEventsReturnType]: P } = {
  IndexTransaction: 'IndexTransaction',
  IndexBlock: 'IndexBlock',
};
