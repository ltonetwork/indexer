import level from 'level';
import offsetStream from 'offset-stream';
import AwaitLock from 'await-lock';

/**
 * Stored all values in memory until flush() is called.
 */
export class LeveldbConnection {
  private writeLock: AwaitLock;
  private cache: Map<string, string|null>;

  constructor(private connection: level.Level) {
    this.writeLock = new AwaitLock();
    this.cache = new Map();
  }

  async get(key: level.KeyType): Promise<string> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

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
    const existing = await this.get(key);
    if (existing) {
      return existing;
    }

    this.cache.set(key, value);
    return value;
  }

  async set(key: level.KeyType, value: string): Promise<string> {
    this.cache.set(key, value);
    return value;
  }

  async del(key: level.KeyType): Promise<0 | 1> {
    this.cache.set(key, null);
    return 1;
  }

  async incr(key, amount = 1): Promise<string> {
    const count = Number(await this.get(key));
    return await this.set(key, String(count + amount));
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

  async flush() {
    if (this.cache.size === 0) {
      return;
    }

    const cache = this.cache;
    this.cache = new Map();

    await this.writeLock.acquireAsync();
    const batch = [];

    for (const [key, value] of cache) {
      batch.push({key, value, type: value !== null ? 'put' : 'del'});
    }

    try {
      await this.connection.batch(batch);
    } finally {
      this.writeLock.release();
    }
  }

  close(): Promise<void> {
    return this.connection.close();
  }
}
