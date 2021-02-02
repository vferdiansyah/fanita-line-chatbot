import { middleware } from '@line/bot-sdk';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './configs/database.config';
import { SequelizeConfigService } from './configs/sequelize.config';
import { SymptomsModule } from './symptoms/symptoms.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      cache: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useClass: SequelizeConfigService,
    }),
    UsersModule,
    SymptomsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const { CHANNEL_ACCESS_TOKEN, CHANNEL_SECRET } = process.env;
    const middlewareConfig = {
      channelAccessToken: CHANNEL_ACCESS_TOKEN,
      channelSecret: CHANNEL_SECRET,
    };

    consumer.apply(middleware(middlewareConfig)).forRoutes({
      path: 'webhook',
      method: RequestMethod.POST,
    });
  }
}
