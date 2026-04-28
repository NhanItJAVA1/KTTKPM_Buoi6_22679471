import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: "*", methods: "GET,POST,PUT,DELETE,PATCH" });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 8082;
  await app.listen(port);
  console.log(`[Movie Service] Running on http://localhost:${port}`);
}

bootstrap();
