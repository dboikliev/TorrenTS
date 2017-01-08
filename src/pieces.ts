import { TorrentFile } from "./torrent";

export class TorrentPiece {

    private pieceIndex: number;
    private blockSize: number;

    constructor (pieceIndex: number, blockSize: number = Math.pow(2, 14)) {
        this.pieceIndex = pieceIndex;
        this.blockSize = blockSize;
    }

    public get blocks(): PieceBlock[] {
        let lastPieceIndex = Math.ceil(window["torrent size"] / window["piece length"]) - 1;
        let lastPieceLength = Math.ceil(window["torrent size"] % window["piece length"]);
        let currentPieceLength = this.pieceIndex === lastPieceIndex ? lastPieceLength : window["piece length"];
        let blocksCount = Math.ceil(window["piece length"] / this.blockSize);
        let blocks = [];
        for (let i = 0; i < blocksCount; i++) {
            if (i === blocksCount - 1) {
                blocks.push(new PieceBlock(this.pieceIndex, i * this.blockSize, currentPieceLength % this.blockSize));
            }
            else {
                blocks.push(new PieceBlock(this.pieceIndex, i * this.blockSize, this.blockSize));
            }
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
    private piecesCount: number;
    private requested: boolean[][];
    private received: boolean[][];
    private totalSize: number;
    private maxPieceSize: number;
    private blockSize: number = Math.pow(2, 14);

    constructor (torrent: TorrentFile) {
        this.totalSize = torrent.size;
        this.maxPieceSize = torrent.pieceLength;
        this.piecesCount = Math.ceil(this.totalSize / this.maxPieceSize);


        this.requested = new Array(this.piecesCount);
        for (let i = 0; i < this.requested.length; i++) {
            if (!this.requested[i]) {
                this.requested[i] = [];
            }

            let currentPieceLength = i === this.piecesCount - 1 ? this.totalSize % this.maxPieceSize : this.maxPieceSize;
            let blocksPerPiece = Math.ceil(this.maxPieceSize / this.blockSize);
            if (i === this.piecesCount - 1) {
                blocksPerPiece = Math.ceil(currentPieceLength / this.maxPieceSize);
            }

            for (let j = 0; j < blocksPerPiece; j++) {
                this.requested[i].push(false);
            }
        }

        // this.requested = this.requested.map((_, index) => new Array(Math.ceil(pieceSize / blockSize)));
        // this.requested.forEach((row, rowInd) => row.forEach((_, colInd) => this.requested[rowInd][colInd] = false));

        this.received = new Array(this.piecesCount);
            for (let i = 0; i < this.received.length; i++) {
            if (!this.received[i]) {
                this.received[i] = [];
            }

            let blocksPerPiece = Math.ceil(this.maxPieceSize / this.blockSize);
            if (i === this.piecesCount - 1) {
                blocksPerPiece = Math.ceil(this.totalSize % this.maxPieceSize);
            }

            for (let j = 0; j < blocksPerPiece; j++) {
                this.received[i].push(false);
            }
        }
    }

    public markRequsted(pieceIndex: number, blockIndex: number) {
        this.requested[pieceIndex][blockIndex] = true;
    }

    public markReceived(pieceIndex: number, blockIndex: number) {
        this.received[pieceIndex][blockIndex] = true;
    }

    public isAvailable(pieceIndex: number, blockIndex: number): boolean {
        return !this.requested[pieceIndex][blockIndex];
    }

    get isDone(): boolean {
        return this.received.every(blocks => blocks.every(block => block));
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