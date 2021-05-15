import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { SmsModule } from './sms/sms.module';
import { MessageModule } from './message/message.module';
import { Message } from './message/message.model';
import { SmsService } from './sms/sms.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadModels: true,
      logging: false
    }),
    SmsModule,
    MessageModule,
    ScheduleModule.forRoot(),
    SequelizeModule.forFeature([Message])
  ],
  controllers: [AppController],
  providers: [AppService, SmsService]
})
export class AppModule {}
