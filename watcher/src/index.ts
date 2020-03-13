/**
 * IMAP watcher server
 * @author Andrey Tokarchuk <netandreus@gmail.com>
 */
import "reflect-metadata";
import {container} from "tsyringe";
import dotEnv = require('dotenv');
import DatabaseConnection from "./Connection/DatabaseConnection";
import Server from "./Services/Server";
import ImapConnection, {OnExpunge, OnMail, OnUpdate} from "./Connection/ImapConnection";
import {exec, ExecResult} from 'ts-process-promises';
import * as os from 'os';
import {PromiseWithEvents} from "ts-process-promises/lib/PromiseWithEvents";
import {FolderSyncStatus} from "./Enum/FolderSyncStatus";

dotEnv.config();

(async () => {
    /**
     * Init services
     */
    let hostname = os.hostname();
    // DatabaseConnection
    let mysqlOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    };
    let databaseConnection = new DatabaseConnection(mysqlOptions);

    // Server
    let server = new Server(databaseConnection);
    container.register(Server, { useValue: server });

    await databaseConnection.connect();
    console.log('[ MySQL ] Connected');

    await server.loadAccounts();
    console.log('Loaded '+server.accounts.length+' accounts');

    // Callbacks for events
    let onConnectionError = function (err: Error) {
        console.log('[ ERROR ] Can not connect to one ore more accounts. Server response: '+err.message);
        process.exit(1);
    };
    let onMail: OnMail = async function (this: ImapConnection, numNewMail: number) {
        let watchingFolder = 'INBOX';
        if (this.connected) {
            console.log('[ Event ] There is '+numNewMail+' new message(s) in account '+this.account.email);
            let [isAccountSyncing, syncInfo] = await Promise.all([
                await server.isAccountSyncing(this.account),
                await server.getFolderSyncInfo(this.account, watchingFolder)
            ]);
            if (isAccountSyncing) {
                console.log('Account is syncing now');
                if (syncInfo.sync_status == FolderSyncStatus.Synced) {
                    console.log('Mark folder as '+FolderSyncStatus.SyncedNeedResync);
                    await server.updateFolderStatus(this.account, watchingFolder, FolderSyncStatus.SyncedNeedResync);
                } else if (syncInfo.sync_status == FolderSyncStatus.Syncing) {
                    console.log('Mark folder as '+FolderSyncStatus.SyncingNeedResync);
                    await server.updateFolderStatus(this.account, watchingFolder, FolderSyncStatus.SyncingNeedResync);
                }
            } else {
                console.log('Account is NOT syncing now. Start sync command.');
                await this.runSync(this.account.email, watchingFolder);
            }
        }
    };
    let onUpdate: OnUpdate = async function (this: ImapConnection, seqno: any, info: any) {
        console.log('[ Event ] Update message seqno: '+seqno+' in account '+this.account.email);
        console.log(info);
        let account = this.account;
        //await this.runSync(this.account.email);
    };
    let onExpunge: OnExpunge = async function (this: ImapConnection, seqno: number) {
        console.log('[ Event ] Expunge seqno: '+seqno+' in account '+this.account.email);
        //await this.runSync(this.account.email);
    };

    await server.connectToAllImaps(onConnectionError, onMail, onUpdate, onExpunge);
    console.log('Connected to '+server.imapConnections.length+' imap servers.');
})();

console.log('Started watcher...');