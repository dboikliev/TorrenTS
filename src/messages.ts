import {BinaryOperations} from "./binaryoperations";

export namespace Messages {
    export interface IMessage {
        length: number;
        messageId: number;
        payload: ArrayBuffer;
        data: ArrayBuffer;
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

    // export class Piece implements IMessage {

    // }

    // export class Cancel implements IMessage {

    // }
}