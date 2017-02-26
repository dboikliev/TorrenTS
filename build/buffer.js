"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BinaryBuffer {
    constructor() {
        this._data = new ArrayBuffer(0);
    }
    write(data) {
        // let concatenation = new Uint8Array(((this.data && this.data.byteLength) || 0) + data.byteLength);
        let left = new Uint8Array(this._data);
        let right = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
        let concatenation = new Uint8Array(left.byteLength + right.byteLength);
        concatenation.set(left, 0);
        concatenation.set(right, left.length);
        this._data = concatenation.buffer;
    }
    get length() {
        return this._data.byteLength;
    }
    get data() {
        return this._data;
    }
    read(length) {
        return this._data.slice(0, length);
    }
    clear(length) {
        this._data = this._data.slice(length && length > 0 ? length : this._data.byteLength);
    }
    elementAt(index) {
        let view = new DataView(this._data, index, 1);
        return view.getInt8(0);
    }
}
exports.BinaryBuffer = BinaryBuffer;
//# sourceMappingURL=buffer.js.map