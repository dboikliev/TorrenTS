export class Buffer {
    private data: ArrayBuffer;

    write (data: ArrayBuffer | Uint8Array) {
        let concatenation = new Uint8Array(((this.data && this.data.byteLength) || 0) + data.byteLength);
        let left = new Uint8Array(this.data);
        let right = new Uint8Array(data);
        concatenation.set(left, 0);
        concatenation.set(right, left.length);
        this.data = concatenation.buffer;
    }

    get length(): number {
        return this.data.byteLength;
    }

    read (length: number): ArrayBuffer {
        return this.data.slice(0, length);
    }

    clear (length?: number) {
        this.data = this.data.slice(length || this.data.byteLength);
    }

    elementAt (index: number): number {
        let view = new DataView(this.data, index, 1);
        return view.getInt8(0)
    }
}