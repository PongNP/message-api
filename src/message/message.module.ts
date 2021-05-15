import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Message } from './message.model';
import { MessageService } from './message.service';

@Module({
  imports:[
    SequelizeModule.forFeature([Message])
  ],
  providers: [MessageService],
  exports: [MessageService]
})
export class MessageModule {}
