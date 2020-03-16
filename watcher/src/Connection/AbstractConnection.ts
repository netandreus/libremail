export type OnError = (err: Error) => void;
export type ReconnectOptions = {
    timeout: number,
    attempts: number
};
export default abstract class AbstractConnection
{
    private readonly _options: {};
    protected _connection: {};
    private _onError: OnError;
    private _reconnectOptions: ReconnectOptions;
    /**
     * Number of failed attempts made to connect the server.
     */
    private _attemptsMade: number;

    constructor(
        options: {},
        reconnectOptions: ReconnectOptions = { timeout: 300, attempts: 3},
        onError: OnError = () => {}
    ) {
        this._options = options;
        this.connection = null;
        this.attemptsMade = 0;
        this.reconnectOptions = {
            timeout: reconnectOptions.timeout,
            attempts: reconnectOptions.attempts
        };

        this.onError = onError ? onError : () => {};
        this.onError = this.onError.bind(this);
    }

    protected async sleep(ms: number): Promise<{}>
    {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    get onError(): OnError {
        return this._onError;
    }

    set onError(value: OnError) {
        this._onError = value;
    }

    isConnected(): boolean
    {
        return this.connection != null;
    }

    get connection(): any {
        return this._connection;
    }

    set connection(value: any) {
        this._connection = value;
    }

    get options(): {} {
        return this._options;
    }

    get reconnectOptions(): ReconnectOptions {
        return this._reconnectOptions;
    }

    set reconnectOptions(value: ReconnectOptions) {
        this._reconnectOptions = value;
    }

    get attemptsMade(): number {
        return this._attemptsMade;
    }

    set attemptsMade(value: number) {
        this._attemptsMade = value;
    }

    abstract makeConnection(): Promise<any>;

    abstract async onConnected(connection: any): Promise<any>;

    async connect(err?: Error): Promise<any>
    {
        if (this.attemptsMade == this.reconnectOptions.attempts) {
            return Promise.reject(err);
        }
        if (this.connection) {
            await this.closeConnection();
            this.connection = null;
            console.log('Connection closed. Start waiting for '+this.reconnectOptions.timeout);
        }
        // @todo thinking, this is some race between callbacks. Gate needed for them.
        this.connection = await this.makeConnection().catch(async (err) => {
            await this.sleep(this.reconnectOptions.timeout);
            console.log('[ '+this.constructor.name+' ] Try to connect: '+this.attemptsMade);
            this.attemptsMade++;
            // Error, occurs during initial connect
            this.connection = await this.connect(err);
            return this.connection;
        });
        this.onConnected(this.connection);
        return this.connection;
    }

    abstract async closeConnection(): Promise<void>;

}