"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TorrentPiece {
    constructor(pieceIndex, torrentSize, maxPieceLength, blockSize = Math.pow(2, 14)) {
        this._torrentSize = torrentSize;
        this._maxPieceLength = maxPieceLength;
        this._pieceIndex = pieceIndex;
        this._blockSize = blockSize;
    }
    get blocks() {
        let lastPieceIndex = Math.floor(this._torrentSize / this._maxPieceLength);
        let lastPieceLength = this._torrentSize % this._maxPieceLength;
        let currentPieceLength = this._pieceIndex === lastPieceIndex ? lastPieceLength : this._maxPieceLength;
        let blocksCount = Math.ceil(currentPieceLength / this._blockSize);
        let blocks = [];
        let blockSize = this._pieceIndex === lastPieceIndex ? currentPieceLength % this._blockSize : this._blockSize;
        for (let i = 0; i < blocksCount; i++) {
            blocks.push(new PieceBlock(this._pieceIndex, i * this._blockSize, blockSize));
        }
        return blocks;
    }
}
exports.TorrentPiece = TorrentPiece;
class PieceBlock {
    constructor(pieceIndex, begin, length) {
        this.pieceIndex = pieceIndex;
        this.begin = begin;
        this.length = length;
    }
    get index() {
        return this.begin / this.length;
    }
    toString() {
        return `{ Piece Index: ${this.pieceIndex}, Begin: ${this.begin}, Length: ${this.length} }`;
    }
}
exports.PieceBlock = PieceBlock;
class PieceManager {
    constructor(torrent) {
        this._blockSize = Math.pow(2, 14);
        this._totalSize = torrent.size;
        this._maxPieceSize = torrent.pieceLength;
        this._piecesCount = Math.ceil(torrent.size / torrent.pieceLength);
        this._requested = new Array(this._piecesCount);
        for (let i = 0; i < this._requested.length; i++) {
            if (!this._requested[i]) {
                this._requested[i] = [];
            }
            let currentPieceLength = i === this._requested.length - 1 ? this._totalSize % this._maxPieceSize : this._maxPieceSize;
            let blocksPerPiece;
            if (i === this._requested.length - 1) {
                blocksPerPiece = Math.ceil(currentPieceLength / this._maxPieceSize);
            }
            else {
                blocksPerPiece = Math.ceil(this._maxPieceSize / this._blockSize);
            }
            for (let j = 0; j < blocksPerPiece; j++) {
                this._requested[i].push(false);
            }
        }
        this._received = new Array(this._piecesCount);
        for (let i = 0; i < this._received.length; i++) {
            if (!this._received[i]) {
                this._received[i] = [];
            }
            let blocksPerPiece = Math.ceil(this._maxPieceSize / this._blockSize);
            if (i === this._received.length - 1) {
                blocksPerPiece = Math.ceil(this._totalSize % this._maxPieceSize);
            }
            for (let j = 0; j < blocksPerPiece; j++) {
                this._received[i].push(false);
            }
        }
    }
    markRequsted(pieceIndex, blockIndex) {
        this._requested[pieceIndex][blockIndex] = true;
    }
    markReceived(pieceIndex, blockIndex) {
        this._received[pieceIndex][blockIndex] = true;
    }
    isAvailable(pieceIndex, blockIndex) {
        return !this._requested[pieceIndex][blockIndex];
    }
    getPieceLength(index) {
        let lastPieceIndex = this._piecesCount - 1;
        let lastPieceLength = index === lastPieceIndex ? this._totalSize % this._maxPieceSize : this._maxPieceSize;
        return lastPieceLength;
    }
    get maxPieceSize() {
        return this._maxPieceSize;
    }
    get totalSize() {
        return this._totalSize;
    }
    get isDone() {
        return this._received.every(blocks => blocks.every(block => block));
    }
}
exports.PieceManager = PieceManager;
class PieceQueue {
    constructor() {
        this.queue = [];
    }
    enqueue(piece) {
        piece.blocks.forEach(block => this.queue.push(block));
    }
    dequeue() {
        return this.queue.shift();
    }
    get length() {
        return this.queue.length;
    }
}
exports.PieceQueue = PieceQueue;
//# sourceMappingURL=pieces.js.map