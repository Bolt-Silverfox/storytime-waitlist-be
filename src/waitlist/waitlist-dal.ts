/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { PrismaBaseDal } from '@hng-sdk/orm';
import { PrismaService } from '../database/prisma.service';
import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WaitlistDal extends PrismaBaseDal<PrismaService, 'waitlistUser'> {
  constructor(readonly prisma: PrismaService) {
    super(prisma, 'waitlistUser');
  }

  async findByEmail(email: string) {
    return await this.prisma.waitlistUser.findUnique({
      where: { email },
    });
  }

  async createWaitlistEntry(data: CreateWaitlistDto) {
    return await this.prisma.waitlistUser.create({
      data: data as Prisma.WaitlistUserCreateInput,
    });
  }

  async getAllPaginated(page: number = 1, limit: number = 10) {
    return this.paginate({
      orderBy: { created_at: 'desc' },
      page,
      limit,
    });
  }

  async getAll() {
    return await this.prisma.waitlistUser.findMany({
      orderBy: { created_at: 'desc' },
    });
  }
}
