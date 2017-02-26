"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ByteConverter {
    static convertUint32ToUint8Array(integer, numberOfBytes, isLittleEndian = false) {
        let buffer = new ArrayBuffer(numberOfBytes);
        let dataView = new DataView(buffer);
        dataView.setUint32(0, integer, isLittleEndian);
        let view = new Uint8Array(buffer);
        return view;
    }
    static convertUint8ArrayToUint32(bytes, isLittleEndian = false) {
        let dataView = new DataView(bytes.buffer);
        let uint32 = dataView.getUint32(0, isLittleEndian);
        return uint32;
    }
    static combineByteArrays(...arrays) {
        let combinedLength = 0;
        for (let index in arrays) {
            let array = arrays[index];
            combinedLength += array.length;
        }
        let combined = new Uint8Array(combinedLength);
        combined.set(arrays[0]);
        let offset = arrays[0].length;
        for (let i = 1; i < arrays.length; i++) {
            combined.set(arrays[i], offset);
            offset += arrays[i].length;
        }
        return combined;
    }
}
exports.ByteConverter = ByteConverter;
//# sourceMappingURL=binaryoperations.js.map