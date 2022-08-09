import level from 'level';
import offsetStream from 'offset-stream';
import AwaitLock from 'await-lock';

/**
 * @todo Move this logic into leveldb.storage.service
 */
export class LeveldbConnection {
  private incrLock: {[key: string]: AwaitLock} = {};

  constructor(private connection: level.Level) {}

  private async lock(key: string) {
    if (!this.incrLock.hasOwnProperty(key)) {
      this.incrLock[key] = new AwaitLock();
    }

    return await this.incrLock[key].acquireAsync();
  }

  private unlock(key: string) {
    this.incrLock[key].release();

    if (!this.incrLock[key].acquired) {
      delete this.incrLock[key];
    }
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
    const promises = keys.map((key: string) => this.get(key));
    return Promise.all(promises);
  }

  async add(key: level.KeyType, value: string): Promise<string> {
    await this.lock(key);

    try {
      const existing = await this.get(key);

      if (existing) return existing;

      const result = await this.connection.put(key, value);
      return result;
    } finally {
      this.unlock(key);
    }
  }

  set(key: level.KeyType, value: string): Promise<string> {
    return this.connection.put(key, value);
  }

  del(key: level.KeyType): Promise<0 | 1> {
    return this.connection.del(key);
  }

  async incr(key, amount = 1): Promise<string> {
    await this.lock(key);

    try {
      const count = Number(await this.get(key));
      const result = await this.set(key, String(count + amount));
      return result;
    } finally {
      this.unlock(key);
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
