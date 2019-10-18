import { RedisStorageService } from './redis.storage.service';

export const services = { RedisStorageService };
export default services;

export const tokens = Object.keys(services).map((key) => services[key]);
