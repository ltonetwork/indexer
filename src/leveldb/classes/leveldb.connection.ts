import level from 'level';
import offsetStream from 'offset-stream';

/**
 * @todo Move this logic into leveldb.storage.service
 */
export class LeveldbConnection {
  constructor(
    private connection: level.Level,
  ) {
  }

  get(key: level.KeyType): Promise<string> {
    return this.connection.get(key);
  }

  mget(keys: level.KeyType[]): Promise<string[]> {
    const opts = keys.map((key: string) => ({type: 'get', key}));
    return this.connection.batch(opts);
  }

  set(key: level.KeyType, value: string): Promise<string> {
    return this.connection.put(key, value);
  }

  del(key: level.KeyType): Promise<0 | 1> {
    return this.connection.del(key);
  }

  async incr(key): Promise<string> {
    let count = 0;
    try {
      count = Number(await this.get(key));
    } catch (e) {}

    return this.set(key, String(count + 1));
  }

  async zaddWithScore(key: level.KeyType, score: string, value: string): Promise<any> {
    const newKey = `${key}!${score}`;
    await this.incrCount(key);
    return this.set(newKey, value);
  }

  async incrCount(key): Promise<any> {
    return this.incr(`${key}:count`);
  }

  async paginate(key: level.KeyType, limit: number, offset: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const _arr = [];
      const start = Number(offset);
      const stop = Number(limit) + start;

      return this.connection.createReadStream({
        gte: key + '!',
        lte: key + '~',
        reverse: true,
        limit: stop,
      }).pipe(offsetStream(start)).on('data', (data) => {
        _arr.push(data.value);
      })
        .on('error', (err) => {
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
