export interface StorageInterface {
  getValue(key: string): Promise<string>;
  getMultipleValues(keys: string[]): Promise<string[]>;
  addValue(key: string, value: string): Promise<void>;
  setValue(key: string, value: string): Promise<void>;
  delValue(key: string): Promise<void>;
  incrValue(key: string, amount?: number): Promise<void>;

  addObject(key: string, value: object): Promise<void>;
  setObject(key: string, value: object): Promise<void>;
  getObject(key: string): Promise<object>;

  addToSet(key: string, value: string | Buffer): Promise<void>;
  delFromSet(key: string, value: string | Buffer): Promise<void>;
  getSet(key: string): Promise<string[]>;
  getBufferSet(key: string): Promise<Buffer[]>;

  // TODO: Too high level
  countTx(type: string, address: string): Promise<number>;
  indexTx(type: string, address: string, transactionId: string, timestamp: number): Promise<void>;
  getTx(type: string, address: string, limit: number, offset: number): Promise<string[]>;
}
