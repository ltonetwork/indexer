import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import cors from 'cors';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';
import { LoggerService } from './logger/logger.service';
import { IndexMonitorService } from './index/index-monitor.service';
import { NestExpressApplication } from '@nestjs/platform-express';

async function readVersionFile(): Promise<string> {
  return new Promise((resolve) => {
    return fs.readFile(path.join(__dirname, 'version.txt'), 'utf-8', (err, data) => {
      if (err) {
        return resolve('unknown');
      } else {
        if (data === '') return resolve('unknown');
        return resolve(data);
      }
    });
  });
}

async function swagger(app: INestApplication) {
  const config = app.get<ConfigService>(ConfigService);
  const version = await readVersionFile();

  const options = new DocumentBuilder()
    .setTitle('LTO Network indexer service')
    .setDescription('Index LTO Network transactions to query information like anchors and DIDs')
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.getApiDocsUrl(), app, document);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  if (config.getApiPrefix() !== '') app.setGlobalPrefix(config.getApiPrefix());

  await swagger(app);

  app.use(cors({ exposedHeaders: ['X-Total'] }));
  app.use(helmet());

  app.useStaticAssets(path.join(__dirname, '..', 'public'));

  await app.listen(config.getPort());

  const logger = app.get<LoggerService>(LoggerService);
  logger.info(`server: running on http://localhost:${config.getPort()}`);

  const indexService = app.get<IndexMonitorService>(IndexMonitorService);
  await indexService.start();
}

bootstrap();
