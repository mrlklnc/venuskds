import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  getAll() {
    return this.prisma.user.findMany();
  }

  getById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  create(data: any) {
    return this.prisma.user.create({
      data,
    });
  }

  update(id: number, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
  async testDB() {
  return this.prisma.musteri.findMany();
  }
}





