import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { DispatcherService } from './dispatcher/dispatcher.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 80);

  // const dispatcherService = app.get<DispatcherService>(DispatcherService);
  // await dispatcherService.start();
}
bootstrap();
