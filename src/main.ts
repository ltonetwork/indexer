import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AnchorService } from './anchor/anchor.service';
import { INestApplication } from '@nestjs/common';

async function swagger(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Anchoring service')
    .setDescription('Anchor data in the blockchain')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);
}

async function anchor(app: INestApplication) {
  const anchorService = app.get<AnchorService>(AnchorService);
  await anchorService.start();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await swagger(app);
  await app.listen(process.env.PORT || 80);
  await anchor(app);
}

bootstrap();
