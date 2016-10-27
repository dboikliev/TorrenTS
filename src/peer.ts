import { Socket } from "./networkio";
import { IMessage, Handshake } from "./messages";

export class Peer {
    private ip: string;
    private port: number;
    private socket: Socket;
    private isHandshakeReceived: boolean = false;

    onReceive: (message: IMessage) => void;

    constructor(ip: string, port: number) {
        this.ip = ip;
        this.port = port;
    }

    connect(): Promise<Peer> {
        return new Promise((resolve, reject) => {
            Socket.create(this.ip, this.port)
            .then(socket => {
                try {
                    socket.onReceive = (data) => this.handleReceivedData(data);
                    this.socket = socket;
                    socket.connect().then(() => resolve(this));
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }

    sendHandshake(infoHash: string): Promise<Peer> {
        return new Promise((resolve, reject) => {
            try {
                let handshake = new Handshake(infoHash);
                this.socket.send(handshake.data)
                    .then(() => resolve(this), reject);
            }
            catch (error) {
                reject(error);
            }
        });
    }

    private handleReceivedData(data: ArrayBuffer) {
        let view = new Uint8Array(data);
        if (!this.isHandshakeReceived) {
            if (data.byteLength > 0 && view[0] === 19) {
                this.isHandshakeReceived = true;
                let handshake = Handshake.parse(data);
                this.onReceive(handshake);
            }
        }
    }
}