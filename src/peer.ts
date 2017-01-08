import { Socket } from "./networkio";
import { MessageParser, IMessage, Handshake, Bitfield, Cancel, Choke, Have, Interested, KeepAlive, NotInterested, Piece, Request, Unchoke, MessageType } from "./messages";
import { Buffer } from "./buffer";
import { ByteConverter } from "./binaryoperations";
import { PieceManager, PieceQueue, TorrentPiece, PieceBlock } from "./pieces";

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
                else if (message.messageId === MessageType.Have) {
                    let pieceIndex = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(message.payload));
                    let isEmpty = this.queue.length === 0;
                    this.queue.enqueue(new TorrentPiece(pieceIndex));
                    if (isEmpty) {
                        this.requestBlock();
                    }
                }
                else if (message.messageId === MessageType.Unchoke) {
                    this.queue.isChoked = false;
                    this.requestBlock();
                }
                else if (message.messageId === MessageType.Piece) {
                    let buf = new Buffer();
                    buf.write(message.payload);
                    let index = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buf.read(4)));
                    buf.clear(4);
                    let begin = ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buf.read(4)));
                    buf.clear(4);

                    chrome.fileSystem.getWritableEntry(window["entry"], we => {
                        (we as FileEntry).createWriter(wr => {
                            wr.onerror = (e) => console.log(e);
                            wr.seek(index * window["piece length"] + begin);
                            wr.write(new Blob([buf.data ], {  type: 'application/octet-binary' } ));
                            console.log("received piece: " + (index * window["piece length"] + begin));
                        });
                    });

                    let blockIndex = Math.ceil(begin / Math.pow(2, 14));
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
                // console.log("REQUESTING BLOCK : " + new Uint8Array(data).join(","));
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
            this.socket.send(new Interested().data);
        }
    }
}