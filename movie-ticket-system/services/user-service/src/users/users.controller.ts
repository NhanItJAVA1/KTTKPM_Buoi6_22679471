import { Controller, Post, Body, Get } from "@nestjs/common";
import { UsersService } from "./users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.usersService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  @Get("health")
  health() {
    return {
      status: "ok",
      service: "user-service",
      timestamp: new Date().toISOString(),
    };
  }
}
