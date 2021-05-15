import { IsEmail, IsOptional, ValidateNested, IsArray, IsDateString } from "class-validator"
import { Type } from 'class-transformer/decorators';
import { AttachmentDto } from "../raw/raw.dto";

export class ShareServiceReportDto {
    @IsEmail()
    sender: string;

    @IsArray()
    receiver: string[];

    @IsOptional()
    @IsArray()
    cc: string[];

    @IsDateString()
    date:string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AttachmentDto)
    attachments : Array<AttachmentDto>;

    constructor(data){
        this.sender = ("sender" in data) ? data.sender : process.env.DEFAULT_SENDER
        this.receiver = ("receiver" in data) ? data.receiver.split(",") : null
        this.cc = ("cc" in data) ? data.cc.split(",") : null
        this.date = ("date" in data) ? data.date : null

        if(!("attachments" in data)){
            this.attachments = null
        }else if(!Array.isArray(data.attachments)){
            this.attachments = null
        }else{
            this.attachments = []
            for(let item of data.attachments){
                this.attachments.push(new AttachmentDto(item))
            }
        }
    }
  }