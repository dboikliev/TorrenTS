import { Socket } from "./networkio";
import { IMessage, Handshake, Bitfield, Cancel, Choke, Have, Interested, KeepAlive, NotInterested, Piece, Request, Unchoke, MessageType } from "./messages";
import { Buffer } from "./buffer";
import { ByteConverter } from "./binaryoperations";
import { PieceManager } from "./pieceManager";
import { PieceQueue } from "./pieceQueue";
import { TorrentPiece } from "./torrentPiece";
import { PieceBlock } from "./pieceBlock";

export class Peer {
    private ip: string;
    private port: number;
    private socket: Socket;
    private isHandshakeReceived: boolean = false;
    private buffer: Buffer = new Buffer();
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
        // console.log("handle");
        this.buffer.write(data);
        
        // console.log(new Uint8Array(this.buffer.read(this.buffer.length)));
        // console.log(this.buffer.length);
        // console.log(data.byteLength);
        let bytesRead = 0;
        if (!this.isHandshakeReceived) {
            this.handleHandshake();
        }
            while (this.buffer.length >= 4 && this.buffer.length >= ByteConverter.convertUint8ArrayToUint32(new Uint8Array(this.buffer.read(4)))) {
                if (this.buffer.length >= 5) {
                    let messageId = this.buffer.elementAt(4);
                    // console.log(MessageType[messageId]);
                    if (messageId === MessageType.Choke && this.buffer.length >= Choke.expectedLength) {
                        let message = this.buffer.read(Choke.expectedLength);
                        bytesRead = message.byteLength;
                        // handleChoke(message);
                            // console.log("Choke received.")
                        this.queue.isChoked = true;
                        // console.log("CHOKE RECEIVED");
                        // this.socket.close();
                    }
                    else if (messageId === MessageType.Bitfield) {
                        let payLoadLength = new Uint8Array(this.buffer.read(4));
                        // console.log(payLoadLength);
                        let length = ByteConverter.convertUint8ArrayToUint32(payLoadLength);
                        // console.log(length);
                        // console.log(this.buffer.length);
                        if (this.buffer.length >= length + 4) {
                            let message = this.buffer.read(length + 4);
                            bytesRead = message.byteLength;
                            // console.log(new Uint8Array(message));
                            let bitfield = Bitfield.parse(message);
                            // console.log("BITFIELD RECEIVED");
                            // console.log(new Uint8Array(bitfield.data));
                            // handleBitfield();
                            // requestPiece(this.socket, this.pieces);

                            let view = new Uint8Array(bitfield.payload);
                            let isEmpty = this.queue.length === 0;
                            for (let i = 0; i < view.length; i++) {
                                let byte = view[i];
                                for (let j = 0; j < 8; j++) {
                                    if (byte % 2) {
                                        this.queue.enqueue(new TorrentPiece(i * 8 + 7 - j));
                                    }
                                    byte /= 2;
                                }
                            }

                            if (isEmpty) {
                                this.requestBlock();
                            }
                        }
                    }
                    else if (messageId === MessageType.Have && this.buffer.length >= Have.expectedLength) {
                        let message = this.buffer.read(Have.expectedLength);
                        bytesRead = message.byteLength;
                        // console.log(new Uint8Array(message))
                        let have = Have.parse(message);
                        // console.log("HAVE RECEIVED");
                        // console.log(new Uint8Array(have.data));
                        let pieceIndex = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(have.payload));
                        // console.log(have);
                        let isEmpty = this.queue.length === 0;
                        this.queue.enqueue(new TorrentPiece(pieceIndex));
                        // console.log("have");
                        if (isEmpty) {
                            this.requestBlock();
                        }
                    }
                    else if (messageId === MessageType.Unchoke && this.buffer.length >= Unchoke.expectedLength) {
                        let message = this.buffer.read(Unchoke.expectedLength);
                        bytesRead = message.byteLength;
                        // console.log("UNCHOKE RECEIVED");
                        // console.log("Unchoke")
                        // console.log(Unchoke.parse(message));
                        // handleUnchoke();
                        this.queue.isChoked = false;
                        this.requestBlock();
                    }
                    else if (messageId === MessageType.Piece && this.buffer.length >= ByteConverter.convertUint8ArrayToUint32(new Uint8Array(this.buffer.read(4))) + 4) {
                        let message = this.buffer.read(ByteConverter.convertUint8ArrayToUint32(new Uint8Array(this.buffer.read(4))) + 4);
                        // console.log(new Uint8Array(message));
                        bytesRead = message.byteLength;
                        let piece = Piece.parse(message);
                        // console.log("PIECE RECEI VED");
                        // console.log(piece);
                        // handlePiece();
                        let buf = new Buffer();
                        buf.write(piece.payload);
                        // console.log(new Uint8Array(piece.payload));
                        let index = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buf.read(4)));
                        buf.clear(4);
                        let begin = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buf.read(4)));
                        buf.clear(4);

                        chrome.fileSystem.getWritableEntry(window["entry"], we => {
                            (we as FileEntry).createWriter(wr => {
                                console.log(new Uint8Array(buf.read(buf.length)));
                                wr.seek(index * window["piece length"] + begin);
                                wr.write(new Blob([new Uint8Array(buf.read(buf.length)) ], {  endings:"native", type: 'application/octet-binary' } ));
                            })
                        })

                        // console.log(`${ index } ${ begin }`);
                        this.pieceManager.markReceived(index, Math.ceil(begin / Math.pow(2, 14)));

                        if (this.pieceManager.isDone) {
                            this.socket.close();
                            // console.log("PIECE COMPLETED");
                        }
                        else {
                            this.requestBlock();
                        }
                    }
                    this.buffer.clear(bytesRead);
                }
        }
    }

    private requestBlock() {
        if (this.queue.isChoked) {
            return;
        }
        while (this.queue.length) {
            let block = this.queue.dequeue();
            if (this.pieceManager.isAvailable(block.pieceIndex, block.index)) {
                let data = new Request(block.pieceIndex, block.begin, block.length).data;
                // console.log("REQUESTING BLOCK : " + new Uint8Array(data));
                this.socket.send(data).then(() => {
                    this.pieceManager.markRequsted(block.pieceIndex, block.index)
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
            // console.log("HANDSHAKE RECEIVED");
            this.socket.send(new Interested().data);
            // console.log("INTERESTED SENT");
        }
    }
}