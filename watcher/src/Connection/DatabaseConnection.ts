import * as mysql from 'mysql2/promise';
import {Connection} from "types/mysql2/promise";
import AbstractConnection from "./AbstractConnection";

export default class DatabaseConnection extends AbstractConnection {

    protected _connection: Connection;

    get connection(): Connection {
        return this._connection;
    }

    set connection(value: Connection) {
        this._connection = value;
    }

    async connect(): Promise<Connection>
    {
        this.connection = await mysql.createConnection(this.options).catch((err) => {
            // Error, occurs during initial connect
            this.onError(err);
        });
        if (!this.connection) {
            return Promise.reject('[ Error ] Connection error');
        }
        // Error, occurs after connection is established
        this.connection.on('error', this.onError);
        return this.connection;
    }

    async query(sql: string, values?: any | any[] | { [param: string]: any }): Promise<mysql.RowDataPacket[]>
    {
        if (values) {
            return await this.connection.query<mysql.RowDataPacket[]>(sql, values);
        } else {
            return await this.connection.query<mysql.RowDataPacket[]>(sql);
        }
    }
}