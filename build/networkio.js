"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as dgram from "dgram"
const net = require("net");
class Socket {
    constructor(id, ip, port) {
        this._ip = ip;
        this._id = id;
        this._port = port;
        this._socket = new net.Socket({ allowHalfOpen: false });
        this._socket.setKeepAlive(true, 100);
        this._socket.on('data', recvBuf => this.onReceive && this.onReceive(recvBuf.buffer));
        this._socket.on('error', error => this.onReceiveError && this.onReceiveError(error));
    }
    get id() {
        return this._id;
    }
    get ip() {
        return this._ip;
    }
    get port() {
        return this._port;
    }
    static create(ip, port) {
        let promise = new Promise((resolve, reject) => {
            resolve(new Socket(0, ip, port));
        });
        return promise;
    }
    connect() {
        let promise = new Promise((resolve, reject) => {
            this._socket.connect(this._port, this._ip, () => {
                resolve(this);
            });
        });
        return promise;
    }
    close() {
        this._socket.end();
    }
    send(data) {
        let payload = data;
        let buffer = Buffer.from(data);
        let promise = new Promise((resolve, reject) => {
            this._socket.write(buffer, (err) => {
                resolve(this);
            });
        });
        return promise;
    }
}
exports.Socket = Socket;
//# sourceMappingURL=networkio.js.map