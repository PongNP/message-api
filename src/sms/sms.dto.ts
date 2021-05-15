import { IsString, IsPhoneNumber, IsOptional, ValidateIf, IsIn, IsNotEmpty } from "class-validator"

export class SMSDto {
    @IsString()
    sender: string;

    @IsPhoneNumber("TH")
    receiver: string;

    @IsString()
    message?: string;

    constructor(data){
        this.sender = ("sender" in data) ? data.sender : null
        this.receiver = ("receiver" in data) ? data.receiver : null
        this.message = ("message" in data) ? data.message : null
    }
  }