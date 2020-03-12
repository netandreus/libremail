import {ImapSimple, Message} from "imap-simple";
import Account from "../Entity/Account";
let imaps = require('imap-simple');
// @see https://github.com/mscdex/node-imap#connection-events
export type OnMail = (numNewMail: number) => void;
export type OnUpdate = (seqno: any, info: any) => void;
export type OnExpunge = (seqno: number) => void;
export type OnReady = () => void;
export type OnAlert = (message: string) => void;
export type OnUidvalidity = (uidvalidity: number) => void;
export type OnError = (err: Error) => void;
export type OnClose = (hadError: boolean) => void;
export type OnEnd = () => void;

type ConnectionOptions = {
    imap: {
        user: string,
        password: string,
        host: string,
        port: number,
        tls: boolean,
        authTimeout: number
    }
};

export default class ImapConnection
{
    private readonly connectOptions: ConnectionOptions;
    private _account: Account;
    private _imap?: ImapSimple;
    private _onMail: OnMail;
    private _onUpdate: OnUpdate;
    private _onExpunge: OnExpunge;
    private _onReady: OnReady;
    private _onAlert: OnAlert;
    private _onUidvalidity: OnUidvalidity;
    private _onError: OnError;
    private _onClose: OnClose;
    private _onEnd: OnEnd;

    constructor(
        account: Account,
        tls: boolean,
        authTimeout: number,
        onMail?: OnMail,
        onUpdate?: OnUpdate,
        onExpunge?: OnExpunge,
        onReady?: OnReady,
        onAlert?: OnAlert,
        onUidvalidity?: OnUidvalidity,
        onError?: OnError,
        onClose?: OnClose,
        onEnd?: OnEnd
    ) {
        this.account = account;
        this.connectOptions = {
            imap: {
                user: account.email,
                password: account.password,
                host: account.imapHost,
                port: account.imapPort,
                tls: tls,
                authTimeout: authTimeout
            }
        };
        this.onMail = onMail ? onMail : () => {};
        this.onMail = this.onMail.bind(this);

        this.onUpdate = onUpdate ? onUpdate : () => {};
        this.onUpdate = this.onUpdate.bind(this);

        this.onExpunge = onExpunge ? onExpunge : () => {};
        this.onExpunge = this.onExpunge.bind(this);

        this.onReady = onReady ? onReady : () => {};
        this.onReady = this.onReady.bind(this);

        this.onAlert = onAlert ? onAlert : () => {};
        this.onAlert = this.onAlert.bind(this);

        this.onUidvalidity = onUidvalidity ? onUidvalidity : () => {};
        this.onUidvalidity = this.onUidvalidity.bind(this);

        this.onError = onError ? onError : () => {};
        this.onError = this.onError.bind(this);

        this.onClose = onClose ? onClose : () => {};
        this.onClose = this.onClose.bind(this);

        this.onEnd = onEnd ? onEnd : () => {};
        this.onEnd = this.onEnd.bind(this);

        this.imap = null;
    }

    async connect(): Promise<ImapSimple>
    {
        this.imap = await imaps.connect(this.connectOptions);

        this.imap.on('mail', this.onMail);
        this.imap.on('update', this.onUpdate);
        this.imap.on('expunge', this.onExpunge);
        this.imap.on('ready', this.onReady);
        this.imap.on('alert', this.onAlert);
        this.imap.on('uidvalidity', this.onUidvalidity);
        this.imap.on('error', this.onError);
        this.imap.on('close', this.onClose);
        this.imap.on('end', this.onEnd);

        // If we does not call openBox - we can't receive events.
        await this.imap.openBox('INBOX');
        return this.imap;
    }


    get imap(): ImapSimple {
        return this._imap;
    }

    set imap(value: ImapSimple) {
        this._imap = value;
    }

    get onMail(): OnMail {
        return this._onMail;
    }

    set onMail(value: OnMail) {
        this._onMail = value;
    }

    get onExpunge(): OnExpunge {
        return this._onExpunge;
    }

    set onExpunge(value: OnExpunge) {
        this._onExpunge = value;
    }

    get onUpdate(): OnUpdate {
        return this._onUpdate;
    }

    set onUpdate(value: OnUpdate) {
        this._onUpdate = value;
    }

    get account(): Account {
        return this._account;
    }

    set account(value: Account) {
        this._account = value;
    }

    get onReady(): () => void {
        return this._onReady;
    }

    set onReady(value: () => void) {
        this._onReady = value;
    }

    get onAlert(): (message: string) => void {
        return this._onAlert;
    }

    set onAlert(value: (message: string) => void) {
        this._onAlert = value;
    }

    get onUidvalidity(): OnUidvalidity {
        return this._onUidvalidity;
    }

    set onUidvalidity(value: OnUidvalidity) {
        this._onUidvalidity = value;
    }

    get onError(): OnError {
        return this._onError;
    }

    set onError(value: OnError) {
        this._onError = value;
    }

    get onClose(): OnClose {
        return this._onClose;
    }

    set onClose(value: OnClose) {
        this._onClose = value;
    }

    get onEnd(): OnEnd {
        return this._onEnd;
    }

    set onEnd(value: OnEnd) {
        this._onEnd = value;
    }
}