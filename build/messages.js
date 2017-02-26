"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const binaryoperations_1 = require("./binaryoperations");
const buffer_1 = require("./buffer");
const CryptoJS = require("crypto-js");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Handshake"] = -2] = "Handshake";
    MessageType[MessageType["KeepAlive"] = -1] = "KeepAlive";
    MessageType[MessageType["Choke"] = 0] = "Choke";
    MessageType[MessageType["Unchoke"] = 1] = "Unchoke";
    MessageType[MessageType["Interested"] = 2] = "Interested";
    MessageType[MessageType["NotInterested"] = 3] = "NotInterested";
    MessageType[MessageType["Have"] = 4] = "Have";
    MessageType[MessageType["Bitfield"] = 5] = "Bitfield";
    MessageType[MessageType["Request"] = 6] = "Request";
    MessageType[MessageType["Piece"] = 7] = "Piece";
    MessageType[MessageType["Cancel"] = 8] = "Cancel";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
class KeepAlive {
    get length() {
        return 1;
    }
    get messageId() {
        return MessageType.KeepAlive;
    }
    get payload() {
        return null;
    }
    get data() {
        return new Uint8Array([0, 0, 0, 0]).buffer;
    }
    static parse(data) {
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
exports.KeepAlive = KeepAlive;
class Handshake {
    constructor(infoHash) {
        this.infoHash = infoHash;
    }
    get length() {
        let combinedLength = 1 + Handshake.message.length + Handshake.clientId.length + Handshake.options.length + this.infoHash.length;
        return combinedLength;
    }
    get messageId() {
        return MessageType.Handshake;
    }
    get payload() {
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
    get data() {
        let arr = [Handshake.message.length];
        for (let i = 0; i < Handshake.message.length; i++) {
            arr.push(Handshake.message.charCodeAt(i));
        }
        for (let index in Handshake.options) {
            arr.push(Handshake.options[index]);
        }
        let messageHeader = new Uint8Array(arr);
        let messageBody = new Uint8Array(this.payload);
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(messageHeader, messageBody);
        return fullMessage.buffer;
    }
    static parse(data) {
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
            throw `The Handshake message should contain the string ${Handshake.message}`;
        }
        let infoHashByes = view.slice(28, 48);
        let infoHash = "";
        for (let index in infoHashByes) {
            infoHash += String.fromCharCode(infoHashByes[index]);
        }
        infoHash = CryptoJS.enc.Latin1.parse(infoHash).toString();
        return new Handshake(infoHash);
    }
}
Handshake.expectedLength = 68;
Handshake.message = "BitTorrent protocol";
Handshake.clientId = "-DB1000-012345678901";
Handshake.options = [0, 0, 0, 0, 0, 0, 0, 0];
exports.Handshake = Handshake;
class Choke {
    get length() {
        return 1;
    }
    get messageId() {
        return MessageType.Choke;
    }
    get payload() {
        return null;
    }
    get data() {
        return new Uint8Array([0, 0, 0, this.length, this.messageId]).buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== Choke.expectedLength) {
            console.log(view);
            throw `The Choke message should be of length ${Choke.expectedLength}.`;
        }
        if (view[0] !== 0 || view[1] !== 0 || view[2] !== 0 || view[3] !== 1) {
            throw "The Choke message should have data of length 1.";
        }
        if (view[4] !== 0) {
            throw "The Choke message should have id equal to 0.";
        }
        return new Choke();
    }
}
Choke.expectedLength = 5;
exports.Choke = Choke;
class Unchoke {
    get length() {
        return 1;
    }
    get messageId() {
        return MessageType.Unchoke;
    }
    get payload() {
        return null;
    }
    get data() {
        return new Uint8Array([0, 0, 0, this.length, this.messageId]).buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== Unchoke.expectedLength) {
            throw `The Unchoke message should be of length ${Unchoke.expectedLength}.`;
        }
        if (view[0] !== 0 || view[1] !== 0 || view[2] !== 0 || view[3] !== 1) {
            throw "The Unchoke message should have data of length 1.";
        }
        if (view[4] !== 1) {
            throw "The Unchoke message should have id equal to 1.";
        }
        return new Unchoke();
    }
}
Unchoke.expectedLength = 5;
exports.Unchoke = Unchoke;
class Interested {
    get length() {
        return 1;
    }
    get messageId() {
        return MessageType.Interested;
    }
    get payload() {
        return null;
    }
    get data() {
        return new Uint8Array([0, 0, 0, this.length, this.messageId]).buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== Interested.expectedLength) {
            throw `The Interested message should be of length ${Interested.expectedLength}.`;
        }
        if (view[0] !== 0 || view[1] !== 0 || view[2] !== 0 || view[3] !== 1) {
            throw "The Interested message should have data of length 1.";
        }
        if (view[4] !== 2) {
            throw "The Interested message should have id equal to 2.";
        }
        return new Interested();
    }
}
Interested.expectedLength = 5;
exports.Interested = Interested;
class NotInterested {
    get length() {
        return 1;
    }
    get messageId() {
        return MessageType.NotInterested;
    }
    get payload() {
        return null;
    }
    get data() {
        return new Uint8Array([0, 0, 0, this.length, this.messageId]).buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== NotInterested.expectedLength) {
            throw `The NotInterested message should be of length ${NotInterested.expectedLength}.`;
        }
        if (view[0] !== 0 || view[1] !== 0 || view[2] !== 0 || view[3] !== 1) {
            throw "The NotInterested message should have data of length 1.";
        }
        if (view[4] !== 3) {
            throw "The NotInterested message should have id equal to 3.";
        }
        return new NotInterested();
    }
}
NotInterested.expectedLength = 5;
exports.NotInterested = NotInterested;
class Have {
    constructor(pieceIndex) {
        if (typeof pieceIndex === "number") {
            this._payload = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(pieceIndex, 4).buffer;
        }
        else if (pieceIndex instanceof ArrayBuffer) {
            this._payload = pieceIndex;
        }
    }
    get length() {
        return 5;
    }
    get messageId() {
        return MessageType.Have;
    }
    get payload() {
        return this._payload;
    }
    get data() {
        let data = new Uint8Array([0, 0, 0, this.length, this.messageId]);
        // let result = new Uint8Array(6);
        // result.set(data, 0);
        // result.set(new Uint8Array(this.payload), data.length);
        return binaryoperations_1.ByteConverter.combineByteArrays(data, new Uint8Array(this.payload)).buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== Have.expectedLength) {
            throw `The Have message should be of length ${Have.expectedLength}.`;
        }
        if (view[0] !== 0 || view[1] !== 0 || view[2] !== 0 || view[3] !== 5) {
            throw "The Have message should have data of length 5.";
        }
        if (view[4] !== 4) {
            throw "The Have message should have id equal to 4.";
        }
        let pieceIndexBytes = view.slice(5);
        return new Have(pieceIndexBytes.buffer);
    }
}
Have.expectedLength = 9;
exports.Have = Have;
class Bitfield {
    constructor(hasPieces) {
        if (hasPieces instanceof ArrayBuffer) {
            this._payload = hasPieces;
        }
        else if (hasPieces instanceof Array) {
            let hasPiecesString = hasPieces.join("");
            let hasPiecesNumerical = parseInt(hasPiecesString, 2);
            let numberOfBytes = Math.ceil(hasPiecesString.length / 8);
            this._payload = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(hasPiecesNumerical, numberOfBytes).buffer;
        }
    }
    get length() {
        return 1 + this._payload.byteLength;
    }
    get messageId() {
        return MessageType.Bitfield;
    }
    get data() {
        let messageBody = new Uint8Array(this.payload);
        let lengthBytes = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(this.length, 4);
        let messageHeader = binaryoperations_1.ByteConverter.combineByteArrays(lengthBytes, new Uint8Array([this.messageId]));
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(messageHeader, messageBody);
        return fullMessage.buffer;
    }
    get payload() {
        return this._payload;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        let dataLength = binaryoperations_1.ByteConverter.convertUint8ArrayToUint32(view.slice(0, 4));
        if (view.byteLength !== 4 + dataLength) {
            throw `The Bitfield message should be of length ${4 + dataLength}.`;
        }
        if (view[4] !== 5) {
            throw "The Bitfield message should have id equal to 5.";
        }
        let hasPiecesBytes = view.slice(5);
        return new Bitfield(hasPiecesBytes.buffer);
    }
}
exports.Bitfield = Bitfield;
class Request {
    constructor(index, begin, length) {
        if (index instanceof ArrayBuffer) {
            this.pieceIndex = new Uint8Array(index);
        }
        else if (typeof index === "number") {
            this.pieceIndex = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(index, 4);
        }
        if (begin instanceof ArrayBuffer) {
            this.begin = new Uint8Array(begin);
        }
        else if (typeof index === "number") {
            this.begin = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(begin, 4);
        }
        if (length instanceof ArrayBuffer) {
            this.blockLength = new Uint8Array(length);
        }
        else if (typeof index === "number") {
            this.blockLength = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(length, 4);
        }
    }
    get length() {
        return 13;
    }
    get messageId() {
        return MessageType.Request;
    }
    get payload() {
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(this.pieceIndex, this.begin);
        fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(fullMessage, this.blockLength);
        return fullMessage.buffer;
    }
    get data() {
        let messageHeader = new Uint8Array([0, 0, 0, this.length, this.messageId]);
        let messageBody = new Uint8Array(this.payload);
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(messageHeader, messageBody);
        return fullMessage.buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== Request.expectedLength) {
            throw `The Request message should be of length ${Request.expectedLength}.`;
        }
        if (view[4] !== 6) {
            throw "The Request message should have id equal to 6.";
        }
        return new Request(view.slice(5, 9).buffer, view.slice(9, 13).buffer, view.slice(13).buffer);
    }
}
Request.expectedLength = 17;
exports.Request = Request;
class Piece {
    constructor(pieceIndex, begin, block) {
        if (pieceIndex instanceof ArrayBuffer) {
            this.pieceIndex = new Uint8Array(pieceIndex);
        }
        else if (typeof pieceIndex === "number") {
            this.pieceIndex = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(pieceIndex, 4);
        }
        if (begin instanceof ArrayBuffer) {
            this.begin = new Uint8Array(begin);
        }
        else if (typeof pieceIndex === "number") {
            this.begin = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(begin, 4);
        }
        if (block instanceof ArrayBuffer) {
            this.block = new Uint8Array(block);
        }
    }
    get length() {
        return this.payload.byteLength + 1;
    }
    get messageId() {
        return MessageType.Piece;
    }
    get payload() {
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(this.pieceIndex, this.begin);
        fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(fullMessage, this.block);
        return fullMessage.buffer;
    }
    get data() {
        let lengthArray = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(this.length, 4);
        let messageIdArray = new Uint8Array([this.messageId]);
        let messageHeader = binaryoperations_1.ByteConverter.combineByteArrays(lengthArray, messageIdArray);
        let messageBody = new Uint8Array(this.payload);
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(messageHeader, messageBody);
        return fullMessage.buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view[4] !== MessageType.Piece) {
            throw "The Piece message should have id equal to 7.";
        }
        let length = binaryoperations_1.ByteConverter.convertUint8ArrayToUint32(view.slice(0, 5));
        if (length + 4 !== view.byteLength) {
            throw `The Piece message should have id equal to ${length + 4}.`;
        }
        let index = view.slice(5, 9).buffer;
        let begin = view.slice(9, 13).buffer;
        let block = view.slice(13).buffer;
        return new Piece(index, begin, block);
    }
}
exports.Piece = Piece;
class Cancel {
    constructor(pieceIndex, begin, pieceLength) {
        if (pieceIndex instanceof ArrayBuffer) {
            this.pieceIndex = new Uint8Array(pieceIndex);
        }
        else if (typeof pieceIndex === "number") {
            this.pieceIndex = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(pieceIndex, 4);
        }
        if (begin instanceof ArrayBuffer) {
            this.begin = new Uint8Array(begin);
        }
        else if (typeof pieceIndex === "number") {
            this.begin = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(begin, 4);
        }
        if (pieceLength instanceof ArrayBuffer) {
            this.pieceLength = new Uint8Array(pieceLength);
        }
        else if (typeof pieceIndex === "number") {
            this.pieceLength = binaryoperations_1.ByteConverter.convertUint32ToUint8Array(pieceLength, 4);
        }
    }
    get length() {
        return 13;
    }
    get messageId() {
        return MessageType.Cancel;
    }
    get payload() {
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(this.pieceIndex, this.begin, this.pieceLength);
        return fullMessage.buffer;
    }
    get data() {
        let messageHeader = new Uint8Array([0, 0, 0, this.length, this.messageId]);
        let messageBody = new Uint8Array(this.payload);
        let fullMessage = binaryoperations_1.ByteConverter.combineByteArrays(messageHeader, messageBody);
        return fullMessage.buffer;
    }
    static parse(data) {
        let view = new Uint8Array(data);
        if (view.byteLength !== Cancel.expectedLength) {
            throw `The Cancel message should be of length ${Cancel.expectedLength}.`;
        }
        if (view[4] !== 7) {
            throw "The Cancel message should have id equal to 7.";
        }
        return new Cancel(view.slice(5, 9).buffer, view.slice(9, 13).buffer, view.slice(13).buffer);
    }
}
Cancel.expectedLength = 17;
exports.Cancel = Cancel;
let parsers = {};
parsers[MessageType.KeepAlive] = KeepAlive.parse;
parsers[MessageType.Choke] = Choke.parse;
parsers[MessageType.Unchoke] = Unchoke.parse;
parsers[MessageType.Interested] = Interested.parse;
parsers[MessageType.NotInterested] = NotInterested.parse;
parsers[MessageType.Have] = Have.parse;
parsers[MessageType.Bitfield] = Bitfield.parse;
parsers[MessageType.Request] = Request.parse;
parsers[MessageType.Piece] = Piece.parse;
parsers[MessageType.Cancel] = Cancel.parse;
class MessageParser {
    static canParse(buffer) {
        if (buffer.length > 4) {
            let messageLength = binaryoperations_1.ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buffer.read(4)));
            // console.log(buffer.length, messageLength);
            if (buffer.length >= messageLength + 4) {
                let messageId = buffer.elementAt(4);
                return !!MessageType[messageId];
            }
        }
        return false;
    }
    static parse(data) {
        let buffer = new buffer_1.BinaryBuffer();
        buffer.write(data);
        if (!MessageParser.canParse(buffer)) {
            return;
        }
        let messageLength = binaryoperations_1.ByteConverter.convertUint8ArrayToUint32(new Uint8Array(buffer.read(4))) + 4;
        let messageId = buffer.elementAt(4);
        let messageData = buffer.read(messageLength);
        let message = parsers[messageId](messageData);
        return message;
    }
}
exports.MessageParser = MessageParser;
//# sourceMappingURL=messages.js.map