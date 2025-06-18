import redis from 'ioredis';
import { REDIS } from '../../constants';

export const redisProviders = [
  {
    provide: REDIS,
    useValue: redis,
  },
];
