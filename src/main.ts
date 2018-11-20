import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AnchorService } from './anchor/anchor.service';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import cors from 'cors';
import helmet from 'helmet';

async function swagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Anchoring service')
    .setDescription('Anchor data in the blockchain')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await swagger(app);

  app.use(cors());
  app.use(helmet());

  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.getPort());

  const anchorService = app.get<AnchorService>(AnchorService);
  await anchorService.start();
}

bootstrap();
