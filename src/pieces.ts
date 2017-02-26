import { TorrentFile } from "./torrent";

export class TorrentPiece {

    private _pieceIndex: number;
    private _blockSize: number;
    private _torrentSize: number;
    private _maxPieceLength: number;

    constructor (pieceIndex: number, torrentSize: number, maxPieceLength: number, blockSize: number = Math.pow(2, 14)) {
        this._torrentSize = torrentSize;
        this._maxPieceLength = maxPieceLength;
        this._pieceIndex = pieceIndex;
        this._blockSize = blockSize;
    }

    public get blocks(): PieceBlock[] {
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

export class PieceBlock {
    public pieceIndex: number;
    public begin: number;
    public length: number;

    constructor(pieceIndex: number, begin: number, length: number) {
        this.pieceIndex = pieceIndex;
        this.begin = begin;
        this.length = length;
    }

    public get index(): number {
        return this.begin / this.length;
    }

    public toString(): string {
        return `{ Piece Index: ${ this.pieceIndex }, Begin: ${ this.begin }, Length: ${ this.length } }`;
    }
}

export class PieceManager {
    private _piecesCount: number;
    private _requested: boolean[][];
    private _received: boolean[][];
    private _totalSize: number;
    private _maxPieceSize: number;
    private _blockSize: number = Math.pow(2, 14);

    constructor (torrent: TorrentFile) {
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

    public markRequsted(pieceIndex: number, blockIndex: number) {
        this._requested[pieceIndex][blockIndex] = true;
    }

    public markReceived(pieceIndex: number, blockIndex: number) {
        this._received[pieceIndex][blockIndex] = true;
    }

    public isAvailable(pieceIndex: number, blockIndex: number): boolean {
        return !this._requested[pieceIndex][blockIndex];
    }

    public getPieceLength(index: number): number {
        let lastPieceIndex = this._piecesCount - 1;
        let lastPieceLength = index === lastPieceIndex ? this._totalSize % this._maxPieceSize : this._maxPieceSize
        return lastPieceLength;
    }

    get maxPieceSize(): number {
        return this._maxPieceSize;
    }

    get totalSize(): number {
        return this._totalSize;
    }

    get isDone(): boolean {
        return this._received.every(blocks => blocks.every(block => block));
    }
}

export class PieceQueue {
    public isChoked: boolean;

    private queue: PieceBlock[] = [];

    public enqueue(piece: TorrentPiece) {
        piece.blocks.forEach(block => this.queue.push(block));
    }

    public dequeue(): PieceBlock {
        return this.queue.shift();
    }

    public get length(): number {
        return this.queue.length;
    }
}