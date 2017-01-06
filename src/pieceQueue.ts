import { PieceBlock } from "./pieceBlock";
import { TorrentPiece } from "./torrentPiece";

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