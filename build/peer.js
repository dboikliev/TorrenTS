"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const networkio_1 = require("./networkio");
const messages_1 = require("./messages");
const buffer_1 = require("./buffer");
const binaryoperations_1 = require("./binaryoperations");
const pieces_1 = require("./pieces");
const fs = require("fs");
class Peer {
    constructor(ip, port, pieceManager) {
        this.isHandshakeReceived = false;
        this.buffer = new buffer_1.BinaryBuffer();
        this.queue = new pieces_1.PieceQueue();
        this.ip = ip;
        this.port = port;
        this.pieceManager = pieceManager;
    }
    connect() {
        return new Promise((resolve, reject) => {
            networkio_1.Socket.create(this.ip, this.port)
                .then(socket => {
                try {
                    socket.onReceive = (data) => this.handleReceivedData(data);
                    socket.onReceiveError = () => {
                        this.socket = new networkio_1.Socket(0, this.ip, this.port);
                        this.socket.connect().then(() => resolve(this), reject);
                    };
                    this.socket = socket;
                    socket.connect().then(() => resolve(this), reject);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    sendHandshake(infoHash) {
        return new Promise((resolve, reject) => {
            try {
                let handshake = new messages_1.Handshake(infoHash);
                this.socket.send(handshake.data)
                    .then(() => resolve(this), reject);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    handleReceivedData(data) {
        this.buffer.write(data);
        if (!this.isHandshakeReceived) {
            this.handleHandshake();
        }
        else {
            let message = messages_1.MessageParser.parse(this.buffer.data);
            while (message) {
                if (message.messageId === messages_1.MessageType.Choke) {
                    this.queue.isChoked = true;
                }
                else if (message.messageId === messages_1.MessageType.Bitfield) {
                    let view = new Uint8Array(message.payload);
                    let wasEmpty = this.queue.length === 0;
                    for (let i = 0; i < view.length; i++) {
                        let byte = view[i];
                        for (let j = 0; j < 8; j++) {
                            if (byte & (1 << (7 - j))) {
                                this.queue.enqueue(new pieces_1.TorrentPiece(i * 8 + j, this.pieceManager.totalSize, this.pieceManager.maxPieceSize));
                            }
                        }
                    }
                    if (wasEmpty) {
                        this.requestBlock();
                    }
                }
                else if (message.messageId === messages_1.MessageType.Have) {
                    let pieceIndex = binaryoperations_1.ByteConverter.convertUint8ArrayToUint32(new Uint8Array(message.payload));
                    let wasEmpty = this.queue.length === 0;
                    this.queue.enqueue(new pieces_1.TorrentPiece(pieceIndex, this.pieceManager.totalSize, this.pieceManager.maxPieceSize));
                    if (wasEmpty) {
                        this.requestBlock();
                    }
                }
                else if (message.messageId === messages_1.MessageType.Unchoke) {
                    this.queue.isChoked = false;
                    this.requestBlock();
                }
                else if (message.messageId === messages_1.MessageType.Piece) {
                    // let buf = new BinaryBuffer();
                    let buf = Buffer.from(message.payload);
                    // buf.write(message.payload);
                    console.log(buf);
                    let index = buf.readUInt32BE(0);
                    // let index = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buf.read(4)));
                    // buf.clear(4);
                    let begin = buf.readUInt32BE(4);
                    // let begin = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buf.read(4)));
                    // buf.clear(4);
                    let fd = fs.openSync("test.mp4", "rs+");
                    let start = index * this.pieceManager.maxPieceSize + begin;
                    console.log(buf);
                    // if (buf.length == 0)
                    console.log("PIECE: ", index, begin, buf.length);
                    fs.writeSync(fd, buf, 8, buf.length - 8, start);
                    fs.closeSync(fd);
                    let blockIndex = Math.ceil(begin / Math.pow(2, 14));
                    this.pieceManager.markRequsted(index, blockIndex);
                    this.pieceManager.markReceived(index, blockIndex);
                    if (this.pieceManager.isDone) {
                        this.socket.close();
                    }
                    else {
                        this.requestBlock();
                    }
                }
                message = messages_1.MessageParser.parse(this.buffer.data);
                if (message) {
                    this.buffer.clear(message.data.byteLength);
                }
            }
            this.socket.send(new messages_1.KeepAlive().data);
        }
    }
    requestBlock() {
        if (this.queue.isChoked) {
            return;
        }
        while (this.queue.length) {
            let block = this.queue.dequeue();
            if (this.pieceManager.isAvailable(block.pieceIndex, block.index)) {
                console.log("BLOCK: ", block.pieceIndex, block.begin, block.length);
                let data = new messages_1.Request(block.pieceIndex, block.begin, block.length).data;
                this.socket.send(data).then(() => {
                });
                break;
            }
        }
    }
    handleHandshake() {
        if (this.buffer.length >= messages_1.Handshake.expectedLength && this.buffer.elementAt(0) === 19) {
            this.isHandshakeReceived = true;
            let messageData = this.buffer.read(messages_1.Handshake.expectedLength);
            this.buffer.clear(messages_1.Handshake.expectedLength);
            let handshake = messages_1.Handshake.parse(messageData);
            this.socket.send(new messages_1.Interested().data);
        }
    }
}
exports.Peer = Peer;
//# sourceMappingURL=peer.js.map