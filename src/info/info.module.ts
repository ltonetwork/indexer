import { Module } from '@nestjs/common';
import { InfoController } from './info.controller';
import { InfoService } from './info.service';
import { ConfigModule } from '../config/config.module';

export const InfoModuleConfig = {
  imports: [ConfigModule],
  controllers: [InfoController],
  providers: [InfoService],
};

@Module(InfoModuleConfig)
export class InfoModule { }