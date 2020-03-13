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

    let markFoldersForResync = async function (connection: ImapConnection, folderNames: string[]) {
        let isAccountSyncing = await server.isAccountSyncing(connection.account);

        folderNames.map(async (folderName) => {
            if (isAccountSyncing) {
                let syncInfo = await server.getFolderSyncInfo(connection.account, folderName);
                if (syncInfo.sync_status == FolderSyncStatus.Synced) {
                    await server.updateFolderStatus(connection.account, folderName, FolderSyncStatus.SyncedNeedResync);
                } else if (syncInfo.sync_status == FolderSyncStatus.Syncing) {
                    await server.updateFolderStatus(connection.account, folderName, FolderSyncStatus.SyncingNeedResync);
                }
            } else {
                await this.runSync(connection.account.email, folderName);
            }
        });
    };

    let onMail: OnMail = async function (this: ImapConnection, numNewMail: number) {
        if (this.connected) {
            console.log('[ Event ] There is '+numNewMail+' new message(s) in account '+this.account.email);
            await markFoldersForResync(this,  ['INBOX']);
        }
    };

    let onUpdate: OnUpdate = async function (this: ImapConnection, seqno: any, info: any) {
        console.log('[ Event ] Update message seqno: '+seqno+' in account '+this.account.email);
        console.log(info);
        let folderNames = await server.getAccountFolderNames(this.account);
        await markFoldersForResync(this, folderNames);
    };
    let onExpunge: OnExpunge = async function (this: ImapConnection, seqno: number) {
        console.log('[ Event ] Expunge seqno: '+seqno+' in account '+this.account.email);
        let folderNames = await server.getAccountFolderNames(this.account);
        await markFoldersForResync(this, folderNames);
    };

    await server.connectToAllImaps(onConnectionError, onMail, onUpdate, onExpunge);
    console.log('Connected to '+server.imapConnections.length+' imap servers.');
})();

console.log('Started watcher...');