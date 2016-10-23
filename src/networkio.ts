export class Socket {
    private _ip: string;
    private _port: number;
    private _id: number;
    // private _received: ArrayBuffer;

    onReceive: (data: ArrayBuffer) => void;
    onReceiveError: (args: chrome.sockets.tcp.ReceiveErrorEventArgs) => void;

    constructor(id: number, ip: string, port: number) {
        this._ip = ip;
        this._id = id;
        this._port = port;

        chrome.sockets.tcp.onReceive.addListener(received => {
            if (received.socketId === this.id) {
                // this._received = received.data;
                this.onReceive(received.data);
            }
        });
        chrome.sockets.tcp.onReceiveError.addListener(error =>  this.onReceiveError(error));
    }

    get id(): number {
        return this._id;
    }

    get ip(): string {
        return this._ip;
    }

        get port(): number {
        return this._port;
    }

    public static create(ip: string, port: number): Promise<Socket> {
        let promise = new Promise<Socket>((resolve, reject) => {
            chrome.sockets.tcp.create(info => {
                resolve(new Socket(info.socketId, ip, port));
            });
        });
        return promise;
    }

    public connect(): Promise<Socket> {
        let promise = new Promise<Socket>((resolve, reject) => {
            chrome.sockets.tcp.connect(this.id, this.ip, this.port, result => {
                if (result >= 0) {
                    resolve(this);
                }
                else {
                    reject(result);
                }
            });
        });
        return promise;
    }

    public send(data: ArrayBuffer): Promise<Socket> {
        let payload = data;

        let promise = new Promise<Socket>((resolve, reject) => {
            chrome.sockets.tcp.send(this.id, payload, () => { resolve(this); });
        });
        return promise;
    }

}

class SocketInfo {
    private id;

    constructor(socketId: number) {
        this.id = socketId;
    }

    get socketId(): number {
        return this.id;
    }
}