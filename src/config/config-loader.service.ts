import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import util from 'util';
import path from 'path';
import fs from 'fs';
import convict from 'convict';

@Injectable()
export class ConfigLoaderService implements OnModuleInit, OnModuleDestroy {
  private config: convict.Config<object>;
  private readonly ttl: number = 300000; // 5 minutes in milliseconds
  private config_reload_interval: NodeJS.Timer;

  constructor() { }

  async onModuleInit() {
    if (!this.config) {
      await this.load();
    }

    if (!this.config_reload_interval) {
      this.config_reload_interval = setInterval(async () => {
        await this.load();
      }, this.ttl);
    }
  }

  async onModuleDestroy() {
    if (this.config_reload_interval) {
      clearInterval(this.config_reload_interval);
    }
  }

  private async load(): Promise<void> {
    const dir = path.resolve(__dirname, './data');

    // @ts-ignore
    this.config = convict(`${dir}/default.schema.json`);
    this.config.loadFile(`${dir}/default.config.json`);

    const env = `${dir}/${this.config.get('env')}.config.json`;

    if (await util.promisify(fs.exists)(env)) {
      this.config.loadFile(env);
    }

    // @todo: determine based on config.provider where to load config from (e.g. dynamodb)
    // then simply merge the config via convict.config.load()
    // @todo: support multiple environments by storing envs and their config in a map

    await this.validate();
  }

  set(key: string, value: any): void {
    this.config.set(key, value);
  }

  get(key?: string): any {
    return this.config.get(key);
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  validate(): any {
    return this.config.validate({ allowed: 'warn' });
  }
}
