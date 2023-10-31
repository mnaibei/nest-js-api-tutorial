import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { error } from 'console';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: AuthDto) {
    try {
      const hash = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          // username: dto.username,
          email: dto.email,
          hash,
        },
        select: {
          id: true,
          username: true,
          email: true,
          createdAt: true,
        },
      });
      return user;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ForbiddenException('Email already exists');
      }
    }
    throw error;
  }

  async login(dto: AuthDto) {
    const user = (await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
      select: {
        email: true,
        hash: true,
      },
    })) as any;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const matchpassword = await argon.verify(user.hash, dto.password);

    if (!matchpassword) {
      throw new ForbiddenException('Incorrect password');
    }

    delete user.hash;
    return user;
  }

  logout() {
    return {
      message: 'I am logging out',
    };
  }
}
