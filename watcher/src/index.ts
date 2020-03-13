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
import { exec } from 'ts-process-promises';
import * as os from 'os';

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

    // Callbacks for events
    let onConnectionError = function (err: Error) {
        console.log('[ ERROR ] Can not connect to one ore more accounts. Server response: '+err.message);
        process.exit(1);
    };
    let onMail: OnMail = async function (this: ImapConnection, numNewMail: number) {
        if (this.connected) {
            let command = process.env.SYNC_PATH + ' --email '+this.account.email+' --folder INBOX --once';
            console.log('[ Event ] There is '+numNewMail+' new message(s) in account '+this.account.email);
            try {
                await exec(command).on('process', (process) => {
                    console.log('[ RUNNING ] SYNC pid = '+process.pid);
                });
            } catch (err) {
                console.log('[ ERROR ] ' +err);
            } finally {
                console.log('[ COMPLETE ] Sync complete for '+this.account.email);
            }
        }
    };
    let onUpdate: OnUpdate = function (this: ImapConnection, seqno: any, info: any) {
        console.log('[ Event ] Update message seqno: '+seqno+' in account '+this.account.email);
        console.log(info);
    };
    let onExpunge: OnExpunge = function (this: ImapConnection, seqno: number) {
        console.log('[ Event ] Expunge seqno: '+seqno+' in account '+this.account.email);
    };
    // Server
    let server = new Server(databaseConnection);
    container.register(Server, { useValue: server });

    await databaseConnection.connect();
    console.log('[ MySQL ] Connected');

    await server.loadAccounts();
    console.log('Loaded '+server.accounts.length+' accounts');

    await server.connectToAllImaps(onConnectionError, onMail, onUpdate, onExpunge);
    console.log('Connected to '+server.imapConnections.length+' imap servers.');
})();

console.log('Started watcher...');