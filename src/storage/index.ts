import { RedisStorageService } from './redis/redis.storage.service';
import { LeveldbStorageService } from './leveldb/leveldb.storage.service';

export const services = { RedisStorageService, LeveldbStorageService };
export default services;

export const tokens = Object.keys(services).map((key) => services[key]);
