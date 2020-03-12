import DatabaseConnection from "../Connection/DatabaseConnection";
import Account from "../Entity/Account";
import ImapConnection, {OnError, OnExpunge, OnMail, OnUpdate} from "../Connection/ImapConnection";
import {ImapSimple} from "imap-simple";

export default class Server
{
    private _dbConnection: DatabaseConnection;
    private _accounts: Account[];
    private _imapConnections: ImapConnection[];

    constructor(dbConnection: DatabaseConnection) {
        this.dbConnection = dbConnection;
    }

    async loadAccounts(): Promise<Account[]>
    {
        let [rows, fields] = await this.dbConnection.query('SELECT * FROM accounts');
        this._accounts = rows.map((row: Record<string, string> ) => {
            return Account.fromDatabase(row);
        });
        return this._accounts;
    }

    async connectToAllImaps(onConnectionError: OnError, onMail?: OnMail, onUpdate?: OnUpdate, onExpunge?: OnExpunge): Promise<any>
    {
        let promises: Promise<ImapSimple>[];
        this.imapConnections = this.accounts.map((account: Account) => {
            return new ImapConnection(
                account,
                Boolean(process.env.MAIL_TLS),
                Number(process.env.MAIL_AUTH_TIMEOUT),
                onMail,
                onUpdate,
                onExpunge
            );
        });
        promises = this.imapConnections.map((connection: ImapConnection) => {
            return connection.connect();
        });
        await Promise.all(promises).catch(onConnectionError);
    }

    get accounts(): Account[] {
        return this._accounts;
    }

    set accounts(value: Account[]) {
        this._accounts = value;
    }


    get dbConnection(): DatabaseConnection {
        return this._dbConnection;
    }

    set dbConnection(value: DatabaseConnection) {
        this._dbConnection = value;
    }

    get imapConnections(): ImapConnection[] {
        return this._imapConnections;
    }

    set imapConnections(value: ImapConnection[]) {
        this._imapConnections = value;
    }
}