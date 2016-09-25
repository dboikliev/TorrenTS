import { Handshake } from "./messages";

export namespace NetworkIO {
    export class Socket {
        private ip: string;
        private port: number;
        private id: number;
        private _received: ArrayBuffer;

        constructor(id: number, ip: string, port: number) {
            this.ip = ip;
            this.id = id;
            this.port = port;
        }

        public static create(ip: string, port: number): Promise<Socket> {
            let promise = new Promise<Socket>((resolve, reject) => {
                chrome.sockets.tcp.create(info => resolve(new Socket(info.socketId, ip, port)));
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
                chrome.sockets.tcp.onReceive.addListener(received => {
                    this._received = received.data;
                    resolve(this);
                });
                chrome.sockets.tcp.onReceiveError.addListener(reject);
                chrome.sockets.tcp.send(this.id, payload, () => {});
            });
            return promise;
        }

        get received(): ArrayBuffer {
            return this._received;
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
}