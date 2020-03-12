import DatabaseConnection from "./DatabaseConnection";
import Account from "../Entity/Account";

export default class Server
{
    private dbConnection: DatabaseConnection;
    private _accounts: Account[];

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

    get accounts(): Account[] {
        return this._accounts;
    }

    set accounts(value: Account[]) {
        this._accounts = value;
    }
}