import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import * as amqp from 'amqplib'
import { MessageService } from './message/message.service';
import { SmsService } from './sms/sms.service';
import { Message } from './message/interface/message.interface';
import { MessageDto } from './message/dto/message.dto';
import { v4 as uuidv4 } from 'uuid';
import { validate, isEmail } from 'class-validator';

import { SMSDto } from 'src/sms/sms.dto';

import { RawEmailDto } from 'src/mail_templates/raw/raw.dto';

import { EmployeeImportErrorDto } from 'src/mail_templates/employee-import-error/employee-import-error.dto';
import { EmployeeImportErrorEmailTemplate } from 'src/mail_templates/employee-import-error/employee-import-error.template';

import { ShareServiceReportDto } from './mail_templates/share-service-report/share-service-report.dto';
import { ShareServiceReportEmailTemplate } from './mail_templates/share-service-report/share-service-report.template';
import { Interval } from '@nestjs/schedule';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private messageService:MessageService,
    private smsService:SmsService,
  ) {
    try {
      this.connectAmqp();
    } catch (error) {
      throw error
    }
  }

  private conn: any
  private channel: any
  private fail_count = 0

  private async setupPayload(input){
    let errors
    switch (input.message_type) {
      case 'SEND_EMAIL':
        let email_dto, sender, receiver, cc, subject, body, attachments
        switch (input.message_name) {
          case 'EMPLOYEE_IMPORT_ERROR': email_dto = new EmployeeImportErrorDto(input.payload); break;
          case 'SHARE_SERVICE_REPORT': email_dto = new ShareServiceReportDto(input.payload); break;
          case 'EMAIL_RAW':
          default: email_dto = new RawEmailDto(input.payload); break;
        }
        errors = await validate(email_dto, { validationError: { target: false } })
        if (errors.length > 0) {
          throw new HttpException(errors, HttpStatus.FORBIDDEN);
        }
          
        switch (input.message_name) {
          case 'EMPLOYEE_IMPORT_ERROR':
            body = EmployeeImportErrorEmailTemplate(email_dto)
            receiver = [ email_dto.receiver ]
            sender = email_dto.sender
            subject = "Tracker employee import error " + email_dto.date_time
            attachments = null
            cc = null
            break;
          case 'SHARE_SERVICE_REPORT':
            if(email_dto.receiver){
              for(let email of email_dto.receiver){
                if(!isEmail(email)){
                  throw new HttpException(`${email} is invalid email.`, HttpStatus.FORBIDDEN);
                }
              }
            }

            if(email_dto.cc){
              for(let email of email_dto.cc){
                if(!isEmail(email)){
                  throw new HttpException(`${email} is invalid email.`, HttpStatus.FORBIDDEN);
                }
              }
            }

            body = ShareServiceReportEmailTemplate(email_dto)
            receiver = email_dto.receiver
            cc = email_dto.cc
            sender = email_dto.sender
            subject = `Share Service Report at ${email_dto.date}`
            attachments = email_dto.attachments
            break;
          case 'EMAIL_RAW':
          default:
            if(email_dto.receiver){
              for(let email of email_dto.receiver){
                if(!isEmail(email)){
                  throw new HttpException(`${email} is invalid email.`, HttpStatus.FORBIDDEN);
                }
              }
            }

            if(email_dto.cc){
              for(let email of email_dto.cc){
                if(!isEmail(email)){
                  throw new HttpException(`${email} is invalid email.`, HttpStatus.FORBIDDEN);
                }
              }
            }

            body = email_dto.body
            receiver = email_dto.receiver
            cc = email_dto.cc
            sender = email_dto.sender
            subject = email_dto.subject
            attachments = email_dto.attachments
            break;
        }
          
        return {
          type: "EMAIL",
          transaction_id: input.transaction_id,
          data: {
            receiver: receiver,
            sender: sender,
            cc: cc,
            subject: subject,
            body: body,
            attachments: attachments
          }
        }
      case 'SEND_SMS':
        let sms_dto = new SMSDto(input.payload)
        errors = await validate(sms_dto, { validationError: { target: false } })
        if (errors.length > 0) {
          throw new HttpException(errors, HttpStatus.FORBIDDEN);
        }
        return {
          type: "SMS",
          transaction_id: input.transaction_id,
          data: sms_dto
        }
      default:
        throw new HttpException('Error: Unknown Message Type', HttpStatus.FORBIDDEN);
    }
  }

  async connectAmqp() {
    this.conn = await amqp.connect({
      hostname: process.env.AMQP_HOST,
      port: parseInt(process.env.AMQP_PORT),
      vhost: process.env.AMQP_VHOST,
      heartbeat: parseInt(process.env.AMQP_HEARTBEAT),
      username: process.env.AMQP_USERNAME,
      password: process.env.AMQP_PASSWORD,
      protocol: process.env.AMQP_PROTOCOL,
    });

    this.channel = await this.conn.createConfirmChannel();
    console.log(` [x] Exchange name: ${process.env.AMQP_EXCHANGENAME}`)
    await this.channel.assertExchange(process.env.AMQP_EXCHANGENAME, process.env.AMQP_EXCHANGETYPE, { durable: true });
    this.channel.prefetch(parseInt(process.env.AMQP_PREFETCH)); //Rate Limit

    console.log(` [x] Queue name: ${process.env.AMQP_QUEUE_NAME}`)
    this.channel.assertQueue(process.env.AMQP_QUEUE_NAME, { durable: true });
    this.channel.bindQueue(process.env.AMQP_QUEUE_NAME, process.env.AMQP_EXCHANGENAME, process.env.AMQP_ROUTINGKEY);
  }

  @Interval(5000)
  async handleInterval() {
    if (this.channel != null){
      try {
        await this.channel.checkQueue(process.env.AMQP_QUEUE_NAME);
        await this.channel.checkExchange(process.env.AMQP_EXCHANGENAME);
        this.fail_count = 0;
      } catch (e) {
        console.log("AMQP check fail...");
        console.log(e);
        this.fail_count++;
        if (this.fail_count == 3){
          console.log("AMQP fail terminated")
          process.exit();
        }
      }
    }
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('message/:transaction_id')
  async getMessage(@Param('transaction_id') transaction_id: string){
    let data = await this.messageService.findOneByTransactionId(transaction_id)
    if(!data){
      return null
    }
    let obj_data:Message = {
      id: data.id,
      message_type : data.message_type,
      message_name : data.message_name || null,
      channel : data.channel || null,
      transaction_id : data.transaction_id || null,
      payload : data.payload || null,
      response : data.response || null,
      is_success : data.is_success,
      created_at : data.created_at
    }
    try {
      if((data.message_type=="SEND_SMS")){
        if(data.response){
          if(data.response["message_id"]){
            obj_data["status"] = await this.smsService.check(data.response["message_id"]);
          }
        }
      }
    } catch (error) {
      if("response" in error){
        obj_data["error"] = {
          status : error.response.stats || 500,
          message : error.message || "Unknown Error."
        }
      }else{
        obj_data["error"] = {
          status : error,
          message : error.message  || "Unknown Error."
        }
      }
    }
    return obj_data
  }

  @Post('message/:transaction_id/resend')
  async resendMessage(@Param('transaction_id') transaction_id: string){
    let data = await this.messageService.findOneByTransactionId(transaction_id)
    if(!data){
      return {
        "statusCode": 404,
        "message": "Not found.",
      }
    }
    const input : MessageDto = {
      message_type : data.message_type,
      message_name : data.message_name,
      channel : data.channel,
      transaction_id : data.transaction_id,
      payload : data.payload
    }
    const payload_msg = await this.setupPayload(input)
    const msg = JSON.stringify(payload_msg)
    try {
      this.channel.publish(process.env.AMQP_EXCHANGENAME, process.env.AMQP_ROUTINGKEY, Buffer.from(msg));
      console.log(`[x] Send : ${msg}`);
      return {
        "statusCode": 200,
        "data": "Data has been resend.",
      }
    } catch (error) {
      data = await this.messageService.update_status(data.id ,{
        response: JSON.stringify(error),
        is_success: false
      })
      console.log(`[x] Error : ${error.message}`);
      return {
        "statusCode": 500,
        "data": error.message,
      }
    }
  }

  @Post('send')
  async send(@Body() input : MessageDto)  : Promise<any> {
    let data
    if(!input.transaction_id){
      input.transaction_id = uuidv4()
      do {
        data = await this.messageService.findOneByTransactionId(input.transaction_id)
      } while (data)
    } else {
      data = await this.messageService.findOneByTransactionId(input.transaction_id)
      if(data){
        throw new HttpException('Transaction ID has been used.', HttpStatus.FORBIDDEN);
      }
    }

    try {
      const payload_msg = await this.setupPayload(input)
      data = await this.messageService.create({
        message_type : input.message_type,
        message_name : input.message_name,
        channel : input.channel,
        transaction_id : input.transaction_id,
        payload: JSON.stringify(input.payload)
      })
      let msg = JSON.stringify(payload_msg)
      try {
        this.channel.publish(process.env.AMQP_EXCHANGENAME, process.env.AMQP_ROUTINGKEY, Buffer.from(msg));
        console.log(`[x] Send : ${msg}`);
      } catch (error) {
        data = await this.messageService.update_status(data.id ,{
          response: JSON.stringify(error),
          is_success: false
        })
        console.log(`[x] Error : ${error.message}`);
      }
      return {
        "statusCode": 201,
        "data": data,
      }
    }catch (error){
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
