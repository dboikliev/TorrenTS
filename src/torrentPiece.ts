import { PieceBlock } from "./pieceBlock";


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