import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { username }
    });

    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { success: false, message: 'Şifre hatalı' };
    }

    return { success: true, message: 'Giriş başarılı', token: 'fake-token' };
  }
}

