import { IsString, IsEmail, IsOptional, ValidateNested, IsArray } from "class-validator"
import { Type } from 'class-transformer/decorators';

export class AttachmentDto {
    @IsString()
    bucket : string

    @IsString()
    key : string

    @IsOptional()
    @IsString()
    filename? : string

    constructor(data){
        this.bucket = ("bucket" in data) ? data.bucket : null
        this.key = ("key" in data) ? data.key : null
        this.filename = ("filename" in data) ? data.filename : data.key
    }
}

export class RawEmailDto {
    @IsEmail()
    sender: string;

    @IsArray()
    receiver: string[];

    @IsOptional()
    @IsArray()
    cc: string[];

    @IsString()
    subject: string;

    @IsString()
    body: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AttachmentDto)
    attachments : Array<AttachmentDto>;

    constructor(data){
        this.sender = ("sender" in data) ? data.sender : process.env.DEFAULT_SENDER
        this.receiver = ("receiver" in data) ? data.receiver.split(",") : null
        this.cc = ("cc" in data) ? data.cc.split(",") : null
        this.subject = ("subject" in data) ? data.subject : null
        this.body = ("body" in data) ? data.body : ""

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