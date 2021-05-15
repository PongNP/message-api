import { IsString, IsEmail, IsDateString, IsArray, IsOptional, ValidateNested } from "class-validator"
import { Type } from 'class-transformer';

export class ErrorDto {
    @IsString()
    username: string;

    @IsArray()
    @ValidateNested()
    @Type(() => String)
    messages:string[]
}

export class EmployeeImportErrorDto {
    @IsEmail()
    sender: string;

    @IsEmail()
    receiver: string;
    
    @IsArray()
    @ValidateNested()
    @Type(() => ErrorDto)
    error_data:ErrorDto[]

    @IsDateString()
    date_time: string;

    constructor(data){
        this.sender = ("sender" in data) ? data.sender : process.env.DEV1112_SENDER
        this.receiver = ("receiver" in data) ? data.receiver : null
        this.error_data = ("error_data" in data) ? data.error_data : null
        this.date_time = ("date_time" in data) ? data.date_time : null
    }
  }