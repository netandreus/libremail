import * as mysql from 'mysql2/promise';
import {Connection} from "types/mysql2/promise";
import AbstractConnection from "./AbstractConnection";
import {MysqlError} from "mysql";

export default class DatabaseConnection extends AbstractConnection {

    protected _connection: Connection;

    get connection(): Connection {
        return this._connection;
    }

    set connection(value: Connection) {
        this._connection = value;
    }

    async connect(err?: MysqlError): Promise<Connection>
    {
        if (this.attemptsMade == this.reconnectOptions.attempts) {
            return Promise.reject(err);
        }
        this.connection = await mysql.createConnection(this.options).catch(async (err) => {
            await this.sleep(this.reconnectOptions.timeout);
            console.log('[ Database ] Try to connect: '+this.attemptsMade);
            this.attemptsMade++;
            // Error, occurs during initial connect
            await this.connect(err);
        });
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