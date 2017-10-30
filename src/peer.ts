import { Socket } from "./networkio";
import { MessageParser, IMessage, Handshake, Bitfield, Cancel, Choke, Have, Interested, KeepAlive, NotInterested, Piece, Request, Unchoke, MessageType } from "./messages";
import { BinaryBuffer } from "./buffer";
import { ByteConverter } from "./binaryoperations";
import { PieceManager, PieceQueue, TorrentPiece, PieceBlock } from "./pieces";

import * as fs from "fs";

export class Peer {
    private ip: string;
    private port: number;
    private socket: Socket;
    private isHandshakeReceived: boolean = false;
    private buffer: BinaryBuffer = new BinaryBuffer();
    private queue: PieceQueue = new PieceQueue();
    private pieceManager: PieceManager;

    onReceive: (message: IMessage) => void;

    constructor(ip: string, port: number, pieceManager: PieceManager) {
        this.ip = ip;
        this.port = port;
        this.pieceManager = pieceManager;
    }

    connect(): Promise<Peer> {
        return new Promise((resolve, reject) => {
            Socket.create(this.ip, this.port)
                .then(socket => {
                    try {
                        socket.onReceive = (data) => this.handleReceivedData(data);
                        socket.onReceiveError = () => {
                            this.socket = new Socket(0, this.ip, this.port);
                            this.socket.connect().then(() => resolve(this),  reject);
                        };
                        this.socket = socket;
                        socket.connect().then(() => resolve(this),  reject);
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
        else {
            let message: IMessage = MessageParser.parse(this.buffer.data);
            while (message) {
                switch (message.messageId)
                {
                    case MessageType.Choke:
                        this.queue.isChoked = true;
                        break;
                    case MessageType.Bitfield:
                        this.handleBitfieldMessage(message);
                        break;
                    case MessageType.Have:
                        this.handleHaveMessage(message);
                        break;
                    case MessageType.Unchoke:
                        this.handleUnchokeMessage();
                        break;
                    case MessageType.Piece:
                        this.handlePieceMessage(message);
                        break;
                }

                message = MessageParser.parse(this.buffer.data);
                if (message) {
                    this.buffer.clear(message.data.byteLength);
                }
            }
            this.socket.send(new KeepAlive().data)
        }
    }

    private handlePieceMessage(message: IMessage) {
        let buffer = Buffer.from(message.payload);
        let index = buffer.readUInt32BE(0);
        let begin = buffer.readUInt32BE(4);
        let fd = fs.openSync("/users/deyan/Downloads/test.mp4", "rs+");
        let start = index * this.pieceManager.maxPieceSize + begin;
        // console.log("PIECE - Index: %d, Begin: %d, Length %d", index, begin, buffer.length);
        fs.writeSync(fd, buffer, 8, buffer.length - 8, start);
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

    private handleUnchokeMessage() {
        this.queue.isChoked = false;
        this.requestBlock();
    }

    private handleHaveMessage(message: IMessage) {
        let pieceIndex = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(message.payload));
        let wasEmpty = this.queue.length === 0;
        this.queue.enqueue(new TorrentPiece(pieceIndex, this.pieceManager.totalSize, this.pieceManager.maxPieceSize));
        if (wasEmpty) {
            this.requestBlock();
        }
    }

    private handleBitfieldMessage(message: IMessage) {
        let view = new Uint8Array(message.payload);
        let wasEmpty = this.queue.length === 0;
        for (let i = 0; i < view.length; i++) {
            let byte = view[i];
            for (let j = 0; j < 8; j++) {
                if (byte & (1 << (7 - j))) {
                    this.queue.enqueue(new TorrentPiece(i * 8 + j, this.pieceManager.totalSize, this.pieceManager.maxPieceSize));
                }
            }
        }
        if (wasEmpty) {
            this.requestBlock();
        }
    }

    private requestBlock() {
        if (this.queue.isChoked) {
            return;
        }
        while (this.queue.length) {
            let block = this.queue.dequeue();
            if (this.pieceManager.isAvailable(block.pieceIndex, block.index)) {
                // console.log("BLOCK: ", block.pieceIndex, block.begin, block.length);
                let request = new Request(block.pieceIndex, block.begin, block.length);
                this.socket.send(request.data);
                break;
            }
        }
    }

    private handleHandshake() {
        if (this.buffer.length >= Handshake.expectedLength && this.buffer.elementAt(0) === 19) {
            this.isHandshakeReceived = true;

            let messageData = this.buffer.read(Handshake.expectedLength);
            this.buffer.clear(Handshake.expectedLength);
            let handshake = Handshake.parse(messageData);
            this.socket.send(new Interested().data);
        }
    }
}