import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AnchorService } from './anchor/anchor.service';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);

  const anchorService = app.get<AnchorService>(AnchorService);
  await anchorService.start();

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
