import "reflect-metadata";
import {container} from "tsyringe";
import dotEnv = require('dotenv');
import DatabaseConnection from "./Services/DatabaseConnection";
import Server from "./Services/Server";

dotEnv.config();

(async () => {
    /**
     * Init services
     */
    // DatabaseConnection
    let mysqlOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    };
    let databaseConnection = new DatabaseConnection(mysqlOptions);
    container.register(DatabaseConnection, { useValue: databaseConnection });

    // Server
    let server = new Server(databaseConnection);
    container.register(Server, { useValue: server });

    // Load accounts
    await databaseConnection.connect();
    console.log('[ MySQL ] Connected');

    await server.loadAccounts();
    console.log('Loaded '+server.accounts.length+' accounts');
})();

console.log('Started watcher...');