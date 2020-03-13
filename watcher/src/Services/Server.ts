import DatabaseConnection from "../Connection/DatabaseConnection";
import Account from "../Entity/Account";
import ImapConnection, {OnError, OnExpunge, OnMail, OnUpdate} from "../Connection/ImapConnection";
import {ImapSimple} from "imap-simple";
import * as os from "os";

export type SyncingInfo = {
    sync_status: string,
    sync_host: string,
    sync_pid: number
};

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

    async getFolderSyncInfo(account: Account, folder: string): Promise<SyncingInfo>
    {
        let [rows, fields] = await this.dbConnection.query(
            "SELECT sync_status, sync_host, sync_pid FROM folders WHERE account_id = ? AND name = ?",
            [account.id, folder]
        );
        return rows[0];
    }

    /**
     * Is some folder of this account is syncing now?
     * @param account
     */
    async isAccountSyncing(account: Account): Promise<boolean>
    {
        let sql =
            "SELECT COUNT(id) as syncing_folders_count " +
            "FROM `folders` " +
            "WHERE account_id = ? AND sync_status IN ('syncing', 'syncing_need_resync')";
        let [rows, fields] = await this.dbConnection.query(sql, [account.id]);
        let count = rows[0]['syncing_folders_count'];
        return (count > 0)? true : false;
    }

    async updateFolderStatus(account: Account, folder: string, status: string): Promise<void>
    {
        let sql = "UPDATE `folders` SET sync_status = ? WHERE account_id = ? AND name = ?";
        await this.dbConnection.query(sql, [status, account.id, folder]);
    }
}