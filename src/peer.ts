import { Socket } from "./networkio";
import { Handshake } from "./messages";

class Peer {
    private ip: string;
    private port: number;
    private id: string;
    private socket: Socket;

    constructor(ip: string, port: number, id: string) {
        this.ip = ip;
        this.port = port;
        this.id = id;
    }

    connect(): Promise<Peer> {
        return new Promise((resolve, reject) => {
            Socket.create(this.ip, this.port)
            .then(socket => {
                try {
                    socket.connect();
                    this.socket = socket;
                    resolve(this);
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
}