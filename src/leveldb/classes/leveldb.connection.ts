import level from 'level';
import offsetStream from 'offset-stream';
import AwaitLock from 'await-lock';

/**
 * @todo Move this logic into leveldb.storage.service
 */
export class LeveldbConnection {
  private incrLock: AwaitLock;

  constructor(private connection: level.Level) {
    this.incrLock = new AwaitLock();
  }

  get(key: level.KeyType): Promise<string> {
    return this.connection.get(key).catch(error => {
      if (error.message?.toLowerCase().includes('key not found in database')) {
        return null;
      }

      throw error;
    });
  }

  mget(keys: level.KeyType[]): Promise<string[]> {
    const promises = keys.map((key: string) => this.connection.get(key).catch(() => null));
    return Promise.all(promises);
  }

  async add(key: level.KeyType, value: string): Promise<string> {
    await this.incrLock.acquireAsync();

    try {
      const existing = await this.connection.get(key).catch(() => null);

      if (existing) return existing;

      const result = await this.connection.put(key, value);
      return result;
    } finally {
      this.incrLock.release();
    }
  }

  set(key: level.KeyType, value: string): Promise<string> {
    return this.connection.put(key, value);
  }

  del(key: level.KeyType): Promise<0 | 1> {
    return this.connection.del(key);
  }

  async incr(key): Promise<string> {
    await this.incrLock.acquireAsync();

    try {
      const count = Number(await this.get(key));
      const result = await this.set(key, String(count + 1));
      return result;
    } finally {
      this.incrLock.release();
    }
  }

  async zaddWithScore(key: level.KeyType, score: string, value: string): Promise<any> {
    const newKey = `${key}!${score}`;
    await this.incrCount(key);
    return this.set(newKey, value);
  }

  async incrCount(key): Promise<void> {
    await this.incr(`${key}:count`);
  }

  async paginate(key: level.KeyType, limit: number, offset: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const _arr = [];
      const start = Number(offset);
      const stop = Number(limit) + start;

      return this.connection
        .createReadStream({
          gte: key + '!',
          lte: key + '~',
          reverse: true,
          limit: stop,
        })
        .pipe(offsetStream(start))
        .on('data', data => {
          _arr.push(data.value);
        })
        .on('error', err => {
          reject(err);
        })
        .on('close', () => {
          reject({});
        })
        .on('end', () => {
          resolve(_arr);
        });
    });
  }

  async countTx(key: level.KeyType): Promise<number> {
    return Number(await this.get(`${key}:count`));
  }

  close(): Promise<void> {
    return this.connection.close();
  }
}
