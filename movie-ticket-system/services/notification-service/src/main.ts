import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: "*", methods: "GET" });

  const port = process.env.PORT || 8086;
  await app.listen(port);
  console.log(`[Notification Service] Running on http://localhost:${port}`);
}

bootstrap();
