import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AnchorService } from './anchor/anchor.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 80);

  const anchorService = app.get<AnchorService>(AnchorService);
  await anchorService.start();
}

bootstrap();
