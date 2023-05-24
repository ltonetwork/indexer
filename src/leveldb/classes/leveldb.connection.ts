import level from 'level';
import offsetStream from 'offset-stream';
import AwaitLock from 'await-lock';

/**
 * Stored all values in memory until flush() is called.
 */
export class LeveldbConnection {
  private writeLock: AwaitLock;
  private flushCache?: Map<string, string|null>;
  private cache: Map<string, string|null>;

  constructor(private connection: level.LevelDB) {
    this.writeLock = new AwaitLock();
    this.cache = new Map();
  }

  private async _get(key: string): Promise<string> {
    return this.connection.get(key).catch(error => {
      if (error.message?.toLowerCase().includes('key not found in database')) {
        return null;
      }

      throw error;
    });
  }

  async get(key: string): Promise<string> {
    return this.cache.has(key) ? this.cache.get(key) :
        this.flushCache?.has(key) ? this.flushCache.get(key) :
        this._get(key);
  }

  mget(keys: string[]): Promise<string[]> {
    const promises = keys.map((key: string) => this.get(key));
    return Promise.all(promises);
  }

  async add(key: string, value: string): Promise<string> {
    const existing = await this.get(key);
    if (existing) {
      return existing;
    }

    this.cache.set(key, value);
    return value;
  }

  async set(key: string, value: string): Promise<string> {
    this.cache.set(key, value);
    return value;
  }

  async del(key: string): Promise<0 | 1> {
    this.cache.set(key, null);
    return 1;
  }

  async incr(key, amount = 1): Promise<string> {
    let current;

    if (this.cache.has(key)) {
      // do nothing
    } else if (this.flushCache?.has(key)) {
      this.cache.set(key, this.flushCache.get(key));
    } else {
      current = await this._get(key) || '0';
    }

    // Current value might have been set during await.
    if (this.cache.has(key)) {
      current = this.cache.get(key);
    }

    const value = (Number(current) + amount).toString();

    this.cache.set(key, value);
    return value;
  }

  async sadd(key: string, value: string): Promise<any> {
    return this.add(`${key}!${value}`, value);
  }

  async srem(key: string, value: string): Promise<any> {
    return this.del(`${key}!${value}`);
  }

  async sget(key: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const _arr = [];

      return this.connection
        .createReadStream({
          gte: key + '!',
          lte: key + '~',
        })
        .on('data', data => {
          _arr.push(data.value);
        })
        .on('error', err => reject(err))
        .on('close', () => reject({}))
        .on('end', () => resolve(_arr));
    });
  }

  async zaddWithScore(key: string, score: string, value: string): Promise<any> {
    const rand = (Math.random() + 1).toString(36).substring(6);
    const newKey = `${key}!${score}:${rand}`;

    await this.incrCount(key);
    return this.set(newKey, value);
  }

  async incrCount(key): Promise<number> {
    return Number(await this.incr(`${key}:count`));
  }

  async paginate(key: string, limit: number, offset: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const _arr = [];
      const start = Number(offset + 1);
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
        .on('error', err => reject(err))
        .on('close', () => reject({}))
        .on('end', () => resolve(_arr));
    });
  }

  async countTx(key: string): Promise<number> {
    return Number(await this.get(`${key}:count`));
  }

  async flush() {
    if (this.cache.size === 0) {
      return;
    }

    await this.writeLock.acquireAsync();

    this.flushCache = this.cache;
    this.cache = new Map();

    const batch = [];

    for (const [key, value] of this.flushCache) {
      batch.push({key, value, type: value !== null ? 'put' : 'del'});
    }

    try {
      await this.connection.batch(batch);
    } finally {
      this.writeLock.release();
      delete this.flushCache;
    }
  }

  close(): Promise<void> {
    return this.connection.close();
  }
}
