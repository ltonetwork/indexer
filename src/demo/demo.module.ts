import { Module } from '@nestjs/common';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { ConfigModule } from '../config/config.module';

export const DemoModuleConfig = {
  imports: [ConfigModule],
  controllers: [DemoController],
  providers: [DemoService],
};

@Module(DemoModuleConfig)
export class DemoModule { }