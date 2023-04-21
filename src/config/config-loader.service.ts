import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import util from 'util';
import path from 'path';
import fs from 'fs';
import convict from 'convict';
import schema from './data/default.schema.json';

type SchemaOf<T extends convict.Schema<any>> = T extends convict.Schema<infer R> ? R : any;
type Schema = SchemaOf<typeof schema>;
type Path = convict.Path<SchemaOf<typeof schema>>;
type PathValue<K extends Path> = K extends null | undefined
  ? Schema
  : K extends convict.Path<Schema>
    ? convict.PathValue<Schema, K>
    : never;

@Injectable()
export class ConfigLoaderService implements OnModuleInit, OnModuleDestroy {
  private config: convict.Config<Schema>;
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
    this.config = convict(schema);
    this.config.loadFile(`${dir}/default.config.json`);

    const env = `${dir}/${this.config.get('env')}.config.json`;

    if (await util.promisify(fs.exists)(env)) {
      this.config.loadFile(env);
    }

    await this.validate();
  }

  set(key: Path, value: any): void {
    this.config.set(key, value);
  }

  get<K extends Path>(key: K): PathValue<K> {
    return this.config.get(key);
  }

  getAll(): Schema {
    return this.config.get();
  }

  has(key: Path): boolean {
    return this.config.has(key);
  }

  validate(): any {
    return this.config.validate({ allowed: 'warn' });
  }
}
