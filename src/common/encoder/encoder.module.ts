import { Module } from '@nestjs/common';
import { encoderProviders } from './encoder.providers';
import { EncoderService } from './encoder.service';

export const EncoderModuleConfig = {
  imports: [],
  controllers: [],
  providers: [
    ...encoderProviders,
    EncoderService,
  ],
  exports: [
    ...encoderProviders,
    EncoderService,
  ],
};

@Module(EncoderModuleConfig)
export class EncoderModule { }
