import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { ConfigModule } from '../config/config.module';

export const DemoModuleConfig = {
  imports: [ConfigModule],
  controllers: [DemoController],
  providers: [],
};

@Module(DemoModuleConfig)
export class DemoModule { }