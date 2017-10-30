// import * as dgram from "dgram"
import * as net from "net";

export class Socket {
    private _ip: string;
    private _port: number;
    private _id: number;
    private _socket: net.Socket;
    // private _received: ArrayBuffer;

    onReceive: (data: ArrayBuffer) => void;
    onReceiveError: (args) => void;

    constructor(id: number, ip: string, port: number) {
        this._ip = ip;
        this._id = id;
        this._port = port;

        this._socket = new net.Socket({ allowHalfOpen: false });
        this._socket.setKeepAlive(true, 100);
        this._socket.on("data", recvBuf => this.onReceive && this.onReceive(recvBuf.buffer));
        this._socket.on("error", error => this.onReceiveError && this.onReceiveError(error));
    }

    private get id(): number {
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
            resolve(new Socket(0, ip, port));
        });
        return promise;
    }

    public connect(): Promise<Socket> {
        let promise = new Promise<Socket>((resolve, reject) => {
            this._socket.connect(this._port, this._ip, () => {
                resolve(this);
            });
        });
        return promise;
    }

    public close(): void {
        this._socket.end();
    }

    public send(data: ArrayBuffer): Promise<Socket> {
        let payload = data;
        let buffer = Buffer.from(data);
        let promise = new Promise<Socket>((resolve, reject) => {
            this._socket.write(buffer, (err) => {
                resolve(this);
            });
        });
        return promise;
    }
}