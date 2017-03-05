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
                if (message.messageId === MessageType.Choke) {
                    this.queue.isChoked = true;
                }
                else if (message.messageId === MessageType.Bitfield) {
                    let view = new Uint8Array(message.payload);
                    let wasEmpty = this.queue.length === 0;
                    for (let i = 0; i < view.length; i++) {
                        let byte = view[i];
                        for (let j = 0; j < 8; j++) {
                            if (byte & (1 << (7 - j))) {
                                this.queue.enqueue(new TorrentPiece(i * 8 + j,
                                    this.pieceManager.totalSize, 
                                    this.pieceManager.maxPieceSize));
                            }
                        }
                    }

                    if (wasEmpty) {
                        this.requestBlock();
                    }
                }
                else if (message.messageId === MessageType.Have) {
                    let pieceIndex = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(message.payload));
                    let wasEmpty = this.queue.length === 0;
                    this.queue.enqueue(new TorrentPiece(pieceIndex,
                                    this.pieceManager.totalSize, 
                                    this.pieceManager.maxPieceSize));
                    if (wasEmpty) {
                        this.requestBlock();
                    }
                }
                else if (message.messageId === MessageType.Unchoke) {
                    this.queue.isChoked = false;
                    this.requestBlock();
                }
                else if (message.messageId === MessageType.Piece) {
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
                    
                    fs.writeSync(fd, buf, 8, buf.length - 8, start)

                    fs.closeSync(fd);
                    
                    let blockIndex = Math.ceil(begin / Math.pow(2, 14));
                    this.pieceManager.markRequsted(index, blockIndex)
                    this.pieceManager.markReceived(index, blockIndex);

                    if (this.pieceManager.isDone) {
                        this.socket.close();
                    }
                    else {
                        this.requestBlock();
                    }
                }
                message = MessageParser.parse(this.buffer.data);
                if (message) {
                    this.buffer.clear(message.data.byteLength);
                }
            }
            this.socket.send(new KeepAlive().data)
        }
    }

    private requestBlock() {
        if (this.queue.isChoked) {
            return;
        }
        while (this.queue.length) {
            let block = this.queue.dequeue();
            if (this.pieceManager.isAvailable(block.pieceIndex, block.index)) {
                console.log("BLOCK: ", block.pieceIndex, block.begin, block.length);
                let data = new Request(block.pieceIndex, block.begin, block.length).data;
                this.socket.send(data).then(() => {

                });
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