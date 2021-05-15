import { Column, CreatedAt, DeletedAt, IsUUID, Model, PrimaryKey, Table, Unique, UpdatedAt } from "sequelize-typescript";

@Table({
    timestamps: true,
    freezeTableName: true,
    paranoid: true,
    modelName : "delivery",
    createdAt : "created_at",
    updatedAt : "updated_at",
    deletedAt : "deleted_at"
})
export class Message extends Model<Message> {
    @PrimaryKey
    @IsUUID(4)
    @Column
    id: string;

    @Column
    message_type : string;

    @Column
    message_name : string;

    @Column
    channel : string;

    @Unique
    @Column
    transaction_id : string;

    @Column('json')
    payload : string;

    @Column('json')
    response : string;

    @Column
    is_success : boolean;

    @CreatedAt
    created_at: Date;

    @UpdatedAt
    updated_at: Date;

    @DeletedAt
    deleted_at: Date;
}