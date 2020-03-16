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
    /**
     * Handler, which try to reconnect and if all attempts failed
     * call onError, passed to constructor.
     */
    private _errorHandler: OnError;
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
            timeout: 500,
            attempts: 3
        };

        this.onError = onError ? onError : () => {};
        this.onError = this.onError.bind(this);

        // this.onError = async (err) => {
        //     if (this.attemptsMade == this.reconnectOptions.attempts) {
        //         onError(err);
        //         return;
        //     }
        //     await this.sleep(this.reconnectOptions.timeout);
        //     this.attemptsMade++;
        //     await this.connect();
        //     this.attemptsMade = 0;
        //     return;
        // };
        // this.onError = this.onError.bind(this);
    }

    private async sleep(ms: number): Promise<{}>
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

    get errorHandler(): (err: Error) => void {
        return this._errorHandler;
    }

    set errorHandler(value: (err: Error) => void) {
        this._errorHandler = value;
    }

    abstract async connect(): Promise<any>;
}