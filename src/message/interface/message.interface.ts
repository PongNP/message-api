export interface Message {
    id: string;
    message_type : string;
    message_name? : string;
    channel? : string;
    transaction_id? : string;
    payload? : string;
    response? : string;
    is_success : boolean;
    created_at : Date;
    status? : object;
    error? : object;
}