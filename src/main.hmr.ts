import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { join } from 'path';
import { renderFile } from 'ejs'
import { IndexMonitorService } from './index/index-monitor.service';

declare const module: any;

async function swagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Anchoring service')
    .setDescription('Anchor data in the blockchain')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await swagger(app);

  const configService = app.get<ConfigService>(ConfigService);
  await app.listen(configService.getPort());

  app.useStaticAssets(join(__dirname, '..', 'public'));

  const indexService = app.get<IndexMonitorService>(IndexMonitorService);
  await indexService.start();

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();
