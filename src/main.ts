import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from './common/config/config.service';
import cors from 'cors';
import helmet from 'helmet';
import * as path from 'path';
import { LoggerService } from './common/logger/logger.service';
import { IndexMonitorService } from './index/index-monitor.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import fs from 'fs';

function swagger(app: INestApplication) {
  const packageJsonFile = fs.existsSync(__dirname + '/package.json') ? './package.json' : '../package.json';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { description, version } = require(packageJsonFile);

  const config = app.get<ConfigService>(ConfigService);

  const options = new DocumentBuilder()
    .setTitle('LTO Network indexer service')
    .setDescription(description)
    .setVersion(version === '0.0.0' ? 'dev' : version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(config.getApiDocsUrl(), app, document);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  if (config.getApiPrefix() !== '') app.setGlobalPrefix(config.getApiPrefix());

  swagger(app);

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
