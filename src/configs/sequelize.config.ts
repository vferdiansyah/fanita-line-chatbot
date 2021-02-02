import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Dialect } from 'sequelize/types';

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createSequelizeOptions(): SequelizeModuleOptions {
    const sequelizeConfig: SequelizeModuleOptions = {
      dialect: this.configService.get<Dialect>('database.dialect'),
      port: this.configService.get<number>('database.port'),
      database: this.configService.get<string>('database.database'),
      host: this.configService.get<string>('database.host'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      autoLoadModels: true,
      pool: {
        min: 1,
        max: 5,
        evict: 10000,
        idle: 10000,
      },
    };

    return sequelizeConfig;
  }
}
