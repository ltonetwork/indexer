import level from 'level';
import { LEVEL } from '../constants';

export const leveldbProviders = [
  {
    provide: LEVEL,
    useValue: level,
  },
];
