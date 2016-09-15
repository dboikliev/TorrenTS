import {BinaryOperations} from "./binaryoperations";

export namespace Messages {
    export interface IMessage {
        length: number;
        messageId: number;
        payload: ArrayBuffer;
        data: ArrayBuffer;
    }

    export class KeepAlive implements IMessage {
        get length(): number {
            return 1;
        }

        get messageId(): number {
            return -2;
        }

        get payload(): ArrayBuffer {
            return null;
        }

        get data(): ArrayBuffer {
            return new Uint8Array([ 0, 0, 0, 0]).buffer;
        }

        static parse(data: ArrayBuffer): KeepAlive {
            let view = new Uint8Array(data);
            if (view.byteLength != 4) {
                throw "The Keep Alive message should be of length 4.";
            }

            if (view.some(byte => byte !== 0)) {
                throw "The Keep Alive message should be an array of bytes with value 0.";
            }

            return new KeepAlive();
        }
    }

    export class Handshake implements IMessage {
        private static expectedLength: number = 68;
        private static message: string = "BitTorrent protocol";
        private static clientId: string = "-DB1000-012345678901";
        private static options: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
        private infoHash: string;

        constructor(infoHash: string) {
            this.infoHash = infoHash;
        }

        get length(): number {
            let combinedLength = 1 + Handshake.message.length + Handshake.clientId.length + Handshake.options.length + this.infoHash.length;
            return combinedLength;
        }

        get messageId(): number {
            return -1;
        }

        get payload(): ArrayBuffer {
            let arr = [];
            this.infoHash.match(/.{2}/g).forEach(element => {
                arr.push(parseInt(element, 16));
            });

            for (let i = 0; i < Handshake.clientId.length; i++) {
                arr.push(Handshake.clientId.charCodeAt(i));
            }

            let view = new Uint8Array(arr);
            return view.buffer;
        }

        get data(): ArrayBuffer {
            let arr: number[] = [ Handshake.message.length ];

            for (let i = 0; i < Handshake.message.length; i++) {
                arr.push(Handshake.message.charCodeAt(i));
            }
            for (let index in Handshake.options) {
                arr.push(Handshake.options[index]);
            }

            let messageHeader = new Uint8Array(arr);
            let messageBody = new Uint8Array(this.payload);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }

        static parse(data: ArrayBuffer): Handshake {
            let view = new Uint8Array(data);

            if (view.byteLength !== Handshake.expectedLength) {
                 throw "The Handshake message should be of length 68.";
            }

            if (view[0] !== 19) {
                throw "The Handshake message should begin with the number 19.";
            }

            let protocol = view.slice(1, 20);
            let protocolMessage = "";
            for (let index in protocol) {
                protocolMessage += String.fromCharCode(protocol[index]);
            }

            if (protocolMessage !== Handshake.message) {
                throw `The Handshake message should contain the string ${ Handshake.message }`;
            }

            let infoHashByes = data.slice(20);
            let infoHash = "";
            for (let index in protocol) {
                infoHash += String.fromCharCode(protocol[index]);
            }

            return new Handshake(infoHash);
        }
    }

    export class Choke implements IMessage {
        get length(): number {
            return 1;
        }

        get messageId(): number {
            return 0;
        }

        get payload(): ArrayBuffer {
            return null;
        }

        get data(): ArrayBuffer {
            return new Uint8Array([ 0, 0, 0, this.length, this.messageId ]).buffer;
        }
    }

    export class Unchoke implements IMessage {
        get length(): number {
            return 1;
        }

        get messageId(): number {
            return 1;
        }

        get payload(): ArrayBuffer {
            return null;
        }

        get data(): ArrayBuffer {
            return new Uint8Array([ 0, 0, 0, this.length, this.messageId ]).buffer;
        }
    }

    export class Interested implements IMessage {
        get length(): number {
            return 1;
        }

        get messageId(): number {
            return 2;
        }

        get payload(): ArrayBuffer {
            return null;
        }

        get data(): ArrayBuffer {
            return new Uint8Array([ 0, 0, 0, this.length, this.messageId ]).buffer;
        }
    }

    export class NotInterested implements IMessage {
        get length(): number {
            return 1;
        }

        get messageId(): number {
            return 3;
        }

        get payload(): ArrayBuffer {
            return null;
        }

        get data(): ArrayBuffer {
            return new Uint8Array([ 0, 0, 0, this.length, this.messageId ]).buffer;
        }
    }

    export class Have implements IMessage {
        private pieceIndex: number;

        constructor(pieceIndex: number) {
            this.pieceIndex = pieceIndex;
        }

        get length(): number {
            return 5;
        }

        get messageId(): number {
            return 4;
        }

        get payload(): ArrayBuffer {
            let data  = new Uint8Array([this.pieceIndex]);
            let result = new Uint8Array(4);
            result.set(result, 3);
            return result.buffer;
        }

        get data(): ArrayBuffer {
            let data =  new Uint8Array([ 0, 0, 0, this.length, this.messageId ]);
            let result = new Uint8Array(6);
            result.set(data, 0);
            result.set(new Uint8Array(this.payload), data.length);
            return result.buffer;
        }
    }

    export class Bitfield implements IMessage {
        private hasPieces: boolean[];


        constructor(hasPieces: boolean[]) {
            this.hasPieces = hasPieces;
        }

        get length(): number {
            return 1 + this.hasPieces.length;
        }

        get messageId(): number {
            return 5;
        }

        get data(): ArrayBuffer {
            let hasPiecesString = this.hasPieces.join("");
            let hasPiecesNumerical = parseInt(hasPiecesString, 2);
            let numberOfBytes = Math.ceil(hasPiecesString.length / 8);
            let messageBody = BinaryOperations.ByteConverter.convertUint32ToUint8Array(hasPiecesNumerical, numberOfBytes);
            return messageBody;
        }

        get payload() {
            let messageBody = new Uint8Array(this.data);
            let lengthBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.length, 4);
            let messageHeader = BinaryOperations.ByteConverter.combineByteArrays(lengthBytes, new Uint8Array([ this.messageId ]), lengthBytes);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }
    }

    export class Request implements IMessage {
        private pieceIndex: number;
        private begin: number;
        private pieceLength: number;

        constructor(pieceIndex: number, begin: number, pieceLength: number) {
            this.pieceIndex = pieceIndex;
            this.begin = begin;
            this.pieceLength = pieceLength;
        }

        get length(): number {
            return 13;
        }

        get messageId(): number {
            return 6;
        }

        get payload(): ArrayBuffer {
            let pieceIndexBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.pieceIndex, 4);
            let beginBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.begin, 4);
            let pieceLengthBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.pieceLength, 4);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(pieceIndexBytes, beginBytes, pieceLengthBytes);
            return fullMessage.buffer;
        }

        get data(): ArrayBuffer {
            let messageHeader =  new Uint8Array([ 0, 0, 0, this.pieceLength, this.messageId ]);
            let messageBody = new Uint8Array(this.payload);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }
    }

    export class Piece implements IMessage {
        private pieceIndex: number;
        private begin: number;
        private pieceLength: number;

        constructor(pieceIndex: number, begin: number, pieceLength: number) {
            this.pieceIndex = pieceIndex;
            this.begin = begin;
            this.pieceLength = pieceLength;
        }

        get length(): number {
            return 13;
        }

        get messageId(): number {
            return 6;
        }

        get payload(): ArrayBuffer {
            let pieceIndexBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.pieceIndex, 4);
            let beginBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.begin, 4);
            let pieceLengthBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.pieceLength, 4);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(pieceIndexBytes, beginBytes, pieceLengthBytes);
            return fullMessage.buffer;
        }

        get data(): ArrayBuffer {
            let messageHeader =  new Uint8Array([ 0, 0, 0, this.pieceLength, this.messageId ]);
            let messageBody = new Uint8Array(this.payload);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }
    }

    export class Cancel implements IMessage {
        private pieceIndex: number;
        private begin: number;
        private pieceLength: number;

        constructor(pieceIndex: number, begin: number, pieceLength: number) {
            this.pieceIndex = pieceIndex;
            this.begin = begin;
            this.pieceLength = pieceLength;
        }

        get length(): number {
            return 13;
        }

        get messageId(): number {
            return 8;
        }

        get payload(): ArrayBuffer {
            let pieceIndexBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.pieceIndex, 4);
            let beginBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.begin, 4);
            let pieceLengthBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.pieceLength, 4);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(pieceIndexBytes, beginBytes, pieceLengthBytes);
            return fullMessage.buffer;
        }

        get data(): ArrayBuffer {
            let messageHeader =  new Uint8Array([ 0, 0, 0, this.pieceLength, this.messageId ]);
            let messageBody = new Uint8Array(this.payload);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }
    }
}