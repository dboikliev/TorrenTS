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
            if (view.byteLength !== 4) {
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
        static expectedLength: number = 5;

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

        static parse(data: ArrayBuffer): Choke {
            let view = new Uint8Array(data);

            if (view.byteLength !== Choke.expectedLength) {
                throw `The Choke message should be of length ${ Choke.expectedLength }.`;
            }

            if (view[0] !== 0 || view[1]  !== 0 || view[2] !== 0 || view[3] !== 1) {
                throw "The Choke message should have data of length 1.";
            }

            if (view[4] !== 0) {
                throw "The Choke message should have id equal to 0.";
            }

            return new Choke();
        }
    }

    export class Unchoke implements IMessage {
        static expectedLength: number = 5;

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

        static parse(data: ArrayBuffer): Unchoke {
            let view = new Uint8Array(data);

            if (view.byteLength !== Unchoke.expectedLength) {
                throw `The Unchoke message should be of length ${ Unchoke.expectedLength }.`;
            }

            if (view[0] !== 0 || view[1]  !== 0 || view[2] !== 0 || view[3] !== 1) {
                throw "The Unchoke message should have data of length 1.";
            }

            if (view[4] !== 1) {
                throw "The Unchoke message should have id equal to 1.";
            }

            return new Unchoke();
        }
    }

    export class Interested implements IMessage {
        static expectedLength: number = 5;

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

        static parse(data: ArrayBuffer): Interested {
            let view = new Uint8Array(data);

            if (view.byteLength !== Interested.expectedLength) {
                throw `The Interested message should be of length ${ Interested.expectedLength }.`;
            }

            if (view[0] !== 0 || view[1]  !== 0 || view[2] !== 0 || view[3] !== 1) {
                throw "The Interested message should have data of length 1.";
            }

            if (view[4] !== 2) {
                throw "The Interested message should have id equal to 2.";
            }

            return new Interested();
        }
    }

    export class NotInterested implements IMessage {
        static expectedLength: number = 5;

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

        static parse(data: ArrayBuffer): NotInterested {
            let view = new Uint8Array(data);

            if (view.byteLength !== NotInterested.expectedLength) {
                throw `The NotInterested message should be of length ${ NotInterested.expectedLength }.`;
            }

            if (view[0] !== 0 || view[1]  !== 0 || view[2] !== 0 || view[3] !== 1) {
                throw "The NotInterested message should have data of length 1.";
            }

            if (view[4] !== 3) {
                throw "The NotInterested message should have id equal to 3.";
            }

            return new NotInterested();
        }
    }

    export class Have implements IMessage {
        static expectedLength: number = 10;
        private _payload: ArrayBuffer;

        constructor(pieceIndex: number | ArrayBuffer) {
            if (typeof pieceIndex === "number") {
                this._payload = BinaryOperations.ByteConverter.convertUint32ToUint8Array(pieceIndex as number, 4);
            }
            else if (pieceIndex instanceof ArrayBuffer) {
                this._payload = pieceIndex;
            }
        }

        get length(): number {
            return 5;
        }

        get messageId(): number {
            return 4;
        }

        get payload(): ArrayBuffer {
            return this._payload;
        }

        get data(): ArrayBuffer {
            let data =  new Uint8Array([ 0, 0, 0, this.length, this.messageId ]);
            let result = new Uint8Array(6);
            result.set(data, 0);
            result.set(new Uint8Array(this.payload), data.length);
            return result.buffer;
        }

        static parse(data: ArrayBuffer): Have {
            let view = new Uint8Array(data);

            if (view.byteLength !== Have.expectedLength) {
                throw `The Have message should be of length ${ Have.expectedLength }.`;
            }

            if (view[0] !== 0 || view[1]  !== 0 || view[2] !== 0 || view[3] !== 5) {
                throw "The Have message should have data of length 5.";
            }

            if (view[4] !== 4) {
                throw "The Have message should have id equal to 4.";
            }

            let pieceIndexBytes = view.slice(6);
            return new Have(pieceIndexBytes);
        }
    }

    export class Bitfield implements IMessage {
        private _payload: ArrayBuffer;


        constructor(hasPieces: boolean[] | ArrayBuffer) {
            if (hasPieces instanceof ArrayBuffer) {
               this._payload = hasPieces as ArrayBuffer;
            }
            else if (hasPieces instanceof Array) {
                let hasPiecesString = hasPieces.join("");
                let hasPiecesNumerical = parseInt(hasPiecesString, 2);
                let numberOfBytes = Math.ceil(hasPiecesString.length / 8);
                this._payload = BinaryOperations.ByteConverter.convertUint32ToUint8Array(hasPiecesNumerical, numberOfBytes);
            }
        }

        get length(): number {
            return 1 + this._payload.byteLength;
        }

        get messageId(): number {
            return 5;
        }

        get data(): ArrayBuffer {
            return this._payload;
        }

        get payload() {
            let messageBody = new Uint8Array(this.data);
            let lengthBytes = BinaryOperations.ByteConverter.convertUint32ToUint8Array(this.length, 4);
            let messageHeader = BinaryOperations.ByteConverter.combineByteArrays(lengthBytes, new Uint8Array([ this.messageId ]), lengthBytes);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }

        static parse(data: ArrayBuffer): Bitfield {
            let view = new Uint8Array(data);

            let dataLength = BinaryOperations.ByteConverter.convertUint8ArrayToUint32(view.slice(0, 5));
            if (data.byteLength === 4 + dataLength) {
                throw `The Bitfield message should be of length ${ 4 + dataLength }.`;
            }

            if (view[4] !== 5) {
                throw "The Bitfield message should have id equal to 5.";
            }

            let hasPiecesBytes = view.slice(5);
            return new Bitfield(hasPiecesBytes);
        }
    }

    export class Request implements IMessage {
        static expectedLength: number = 17;
        private pieceIndex: Uint8Array;
        private begin: Uint8Array;
        private pieceLength: Uint8Array;

        constructor(pieceIndex: number | ArrayBuffer, begin: number | ArrayBuffer, pieceLength: number | ArrayBuffer) {
            if (pieceIndex instanceof ArrayBuffer) {
                this.pieceIndex = new Uint8Array(pieceIndex);
            }
            else if (typeof pieceIndex === "number") {
                this.pieceIndex = BinaryOperations.ByteConverter.convertUint32ToUint8Array(pieceIndex, 4);
            }

            if (begin instanceof ArrayBuffer) {
                this.begin = new Uint8Array(begin);
            }
            else if (typeof pieceIndex === "number") {
                this.begin = BinaryOperations.ByteConverter.convertUint32ToUint8Array(begin, 4);
            }

            if (pieceLength instanceof ArrayBuffer) {
                this.pieceLength = new Uint8Array(pieceLength);
            }
            else if (typeof pieceIndex === "number") {
                this.pieceLength = BinaryOperations.ByteConverter.convertUint32ToUint8Array(pieceLength, 4);
            }
        }

        get length(): number {
            return 13;
        }

        get messageId(): number {
            return 6;
        }

        get payload(): ArrayBuffer {
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(this.pieceIndex, this.begin, this.pieceLength);
            return fullMessage.buffer;
        }

        get data(): ArrayBuffer {
            let messageHeader =  new Uint8Array([ 0, 0, 0, this.length, this.messageId ]);
            let messageBody = new Uint8Array(this.payload);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }

        static parse(data: ArrayBuffer): Request {
            let view = new Uint8Array(data);

            if (view.byteLength !== Request.expectedLength) {
                throw `The Request message should be of length ${ Request.expectedLength }.`;
            }

            if (view[4] !== 6) {
                throw "The Request message should have id equal to 6.";
            }

            return new Request(view.slice(5, 9), view.slice(9, 13), view.slice(13));
        }
    }

    export class Piece implements IMessage {
        static expectedLength: number = 17;
        private pieceIndex: Uint8Array;
        private begin: Uint8Array;
        private pieceLength: Uint8Array;

        constructor(pieceIndex: number | ArrayBuffer, begin: number | ArrayBuffer, pieceLength: number | ArrayBuffer) {
            if (pieceIndex instanceof ArrayBuffer) {
                this.pieceIndex = new Uint8Array(pieceIndex);
            }
            else if (typeof pieceIndex === "number") {
                this.pieceIndex = BinaryOperations.ByteConverter.convertUint32ToUint8Array(pieceIndex, 4);
            }

            if (begin instanceof ArrayBuffer) {
                this.begin = new Uint8Array(begin);
            }
            else if (typeof pieceIndex === "number") {
                this.begin = BinaryOperations.ByteConverter.convertUint32ToUint8Array(begin, 4);
            }

            if (pieceLength instanceof ArrayBuffer) {
                this.pieceLength = new Uint8Array(pieceLength);
            }
            else if (typeof pieceIndex === "number") {
                this.pieceLength = BinaryOperations.ByteConverter.convertUint32ToUint8Array(pieceLength, 4);
            }
        }

        get length(): number {
            return 13;
        }

        get messageId(): number {
            return 7;
        }

        get payload(): ArrayBuffer {
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(this.pieceIndex, this.begin, this.pieceLength);
            return fullMessage.buffer;
        }

        get data(): ArrayBuffer {
            let messageHeader =  new Uint8Array([ 0, 0, 0, this.length, this.messageId ]);
            let messageBody = new Uint8Array(this.payload);
            let fullMessage = BinaryOperations.ByteConverter.combineByteArrays(messageHeader, messageBody);
            return fullMessage.buffer;
        }

        static parse(data: ArrayBuffer): Piece {
            let view = new Uint8Array(data);

            if (view.byteLength !== Request.expectedLength) {
                throw `The Piece message should be of length ${ Request.expectedLength }.`;
            }

            if (view[4] !== 7) {
                throw "The Piece message should have id equal to 7.";
            }

            return new Piece(view.slice(5, 9), view.slice(9, 13), view.slice(13));
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