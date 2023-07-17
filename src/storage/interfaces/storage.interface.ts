export interface StorageInterface {
  getValue(key: string): Promise<string>;
  getMultipleValues(keys: string[]): Promise<string[]>;
  addValue(key: string, value: string): Promise<void>;
  setValue(key: string, value: string): Promise<void>;
  delValue(key: string): Promise<void>;
  incrValue(key: string, amount?: number): Promise<void>;

  addObject(key: string, value: Record<string | number, any>): Promise<void>;
  setObject(key: string, value: Record<string | number, any>): Promise<void>;
  getObject(key: string): Promise<Record<string | number, any>>;

  addToSet(key: string, value: string | Buffer): Promise<void>;
  delFromSet(key: string, value: string | Buffer): Promise<void>;
  getSet(key: string): Promise<string[]>;
  getBufferSet(key: string): Promise<Buffer[]>;

  countSortedSet(key: string): Promise<number>;
  addToSortedSet(key: string, value: string, score: number): Promise<void>;
  getSortedSet(key: string, limit?: number, offset?: number): Promise<string[]>;
}
