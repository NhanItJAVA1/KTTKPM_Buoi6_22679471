import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "../entities/user.entity";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { KafkaProducer } from "../kafka/kafka.producer";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException("Email hoặc username đã tồn tại");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
    });

    const saved = await this.usersRepository.save(user);

    await this.kafkaProducer.publishEvent("user-events", "USER_REGISTERED", {
      userId: saved.id,
      email: saved.email,
      username: saved.username,
      registeredAt: saved.createdAt.toISOString(),
    });

    return {
      id: saved.id,
      email: saved.email,
      username: saved.username,
      createdAt: saved.createdAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      username: user.username,
    });

    return {
      access_token: token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }
}
