import winston from 'winston';
import { WINSTON } from '../../constants';

export const loggerProviders = [
  {
    provide: WINSTON,
    useValue: winston,
  },
];
