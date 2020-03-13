import * as mysql from 'mysql2/promise';
import {Connection} from "types/mysql2/promise";

export default class DatabaseConnection {
    private readonly connectOptions: Record<string, string>;
    private mysql2: Connection | null;

    constructor(connectOptions: Record<string, string>)
    {
        this.connectOptions = connectOptions;
        this.mysql2 = null;
    }

    async connect(): Promise<Connection>
    {
        this.mysql2 = await mysql.createConnection(this.connectOptions);
        return this.mysql2;
    }

    isConnected(): boolean
    {
        return this.mysql2 != null;
    }

    async query(sql: string, values?: any | any[] | { [param: string]: any }): Promise<mysql.RowDataPacket[]>
    {
        if (values) {
            return await this.mysql2.query<mysql.RowDataPacket[]>(sql, values);
        } else {
            return await this.mysql2.query<mysql.RowDataPacket[]>(sql);
        }
    }
}