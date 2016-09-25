import { NetworkIO } from "./networkio";

class Peer {
    private ip: string;
    private port: number;
    private id: string;

    constructor(ip: string, port: number, id: string) {
        this.ip = ip;
        this.port = port;
        this.id = id;
    }

    connect() {
        NetworkIO.Socket.create(this.ip, this.port)
            .then(socket => socket.connect());
    }
}