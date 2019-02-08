import { Injectable } from '@nestjs/common';
import util from 'util';
import fs from 'fs';
import { ConfigService } from '../config/config.service';

@Injectable()
export class DemoService {
  constructor(private readonly config: ConfigService) { }

  async info(): Promise<object> {
    const data = await util.promisify(fs.readFile)('package.json', { encoding: 'utf8' });
    const json = JSON.parse(data);

    return {
      name: json.name,
      version: json.version,
      description: json.description,
      env: this.config.getEnv(),
    };
  }
}
