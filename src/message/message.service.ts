import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MessageDto, UpdateDto } from './dto/message.dto';
import { Message } from './message.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message) private messageModel: typeof Message
    ){

    }

    async findAll() {
        return await this.messageModel.findAll();
    }

    async findOne(id: string) {
        return await this.messageModel.findByPk(id);
    }

    async findOneByTransactionId(transaction_id: string) {
        return await this.messageModel.findOne({where : {transaction_id : transaction_id}});
    }

    async create(createDto: MessageDto) {
        return await this.messageModel.create({
            id: uuidv4(),
            message_type: createDto.message_type,
            message_name: ("message_name" in createDto) ? createDto.message_name : null,
            channel: ("channel" in createDto) ? createDto.channel : null,
            transaction_id: ("transaction_id" in createDto) ? createDto.transaction_id : null,
            payload: ("payload" in createDto) ? createDto.payload : null,
        });
    }
    
    async update_status(id: string, updateDto: UpdateDto) {
        var data = await this.findOne(id);
        if(!data){ return null; }

        data.response = ("response" in updateDto) ? updateDto.response : null
        data.is_success = updateDto.is_success
        data.save()

        return data
    }

    async delete(id: string) {
        return await this.messageModel.destroy({ where:{ id : id } })
    }
}
