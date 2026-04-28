import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: "*", methods: "GET,POST,PUT,DELETE" });

  const port = process.env.PORT || 8084;
  await app.listen(port);
  console.log(`[Payment Service] Running on http://localhost:${port}`);
}

bootstrap();
