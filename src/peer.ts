import { Socket } from "./networkio";
import { IMessage, Handshake, Bitfield, Cancel, Choke, Have, Interested, KeepAlive, NotInterested, Piece, Request, Unchoke, MessageType } from "./messages";
import { Buffer } from "./buffer";

export class Peer {
    private ip: string;
    private port: number;
    private socket: Socket;
    private isHandshakeReceived: boolean = false;
    private buffer: Buffer = new Buffer();

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
        this.buffer.write(data);

        if (!this.isHandshakeReceived) {
           this.handleHandshake();
        }
    }

    private handleHandshake() {
        if (this.buffer.length >= Handshake.expectedLength && this.buffer.elementAt(0) === 19) {
            this.isHandshakeReceived = true;

            let messageData = this.buffer.read(Handshake.expectedLength);
            this.buffer.clear(Handshake.expectedLength);
            console.log(new Uint8Array(messageData).join(","));
            let handshake = Handshake.parse(messageData);

            this.onReceive(handshake);
        }
    }
}