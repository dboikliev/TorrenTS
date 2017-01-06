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