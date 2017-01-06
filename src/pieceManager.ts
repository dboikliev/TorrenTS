import { PieceBlock } from "./pieceBlock";
import { TorrentFile } from "./torrent";

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

        console.log(this.requested);
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