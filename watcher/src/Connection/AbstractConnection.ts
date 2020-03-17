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
        let callback = (resolve, reject, attemptCount: number = 0) => {
            let [attempts, timeout] = [
                this.reconnectOptions.attempts,
                this.reconnectOptions.timeout
            ];
            this.makeConnection()
                .then((connect) => {
                    this.connection = connect;
                    this.onConnected(this.connection);
                    resolve(connect);
                })
                .catch(function (e) {
                    console.log('Try ...'+attemptCount);
                    if (attemptCount > attempts) {
                        reject(e);
                        return;
                    }
                    let timeoutPromise = new Promise(resolve => setTimeout(resolve, timeout));
                    timeoutPromise.then(() => {
                        callback(resolve, reject, ++attemptCount);
                    });
                });
        };
        return new Promise<any>(callback);
    }

    // async connectOld(err?: Error): Promise<any>
    // {
    //     if (this.attemptsMade == this.reconnectOptions.attempts) {
    //         return Promise.reject(err);
    //     }
    //     let isRejected = false;
    //     this.connection = await this.makeConnection()
    //         .catch(async (err) => {
    //             await this.sleep(this.reconnectOptions.timeout);
    //             console.log('[ '+this.constructor.name+' ] Try to connect: '+this.attemptsMade);
    //             this.attemptsMade++;
    //             // Error, occurs during initial connect
    //             this.connection = await this.connect(err);
    //             isRejected = true;
    //             return this.connection;
    //         });
    //     if (!isRejected) {
    //         this.onConnected(this.connection);
    //         return this.connection;
    //     }
    // }

    abstract async closeConnection(): Promise<void>;

}