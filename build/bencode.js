"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BencodedObject {
    constructor(value) {
        this.value = value;
    }
}
exports.BencodedObject = BencodedObject;
class BencodedString extends BencodedObject {
    encode() {
        return `${this.value.length}:${this.value}`;
    }
}
exports.BencodedString = BencodedString;
class BencodedInteger extends BencodedObject {
    encode() {
        return `i${this.value}e`;
    }
}
exports.BencodedInteger = BencodedInteger;
class BencodedList extends BencodedObject {
    constructor(value = []) {
        super(value);
    }
    add(object) {
        this.value.push(object);
    }
    encode() {
        let encodedList = "l";
        this.value.forEach((value) => {
            encodedList += value.encode();
        });
        encodedList += "e";
        return encodedList;
    }
}
exports.BencodedList = BencodedList;
class BencodedDictionary extends BencodedObject {
    constructor(value = {}) {
        super(value);
    }
    add(key, value) {
        this.value[key.value] = value;
    }
    encode() {
        let encodedDictionary = "d";
        let keys = Object.getOwnPropertyNames(this.value);
        keys.forEach((key) => {
            let encodedKeyValuePair = `${new BencodedString(key).encode()}${this.value[key].encode()}`;
            encodedDictionary += encodedKeyValuePair;
        });
        encodedDictionary += "e";
        return encodedDictionary;
    }
}
exports.BencodedDictionary = BencodedDictionary;
//# sourceMappingURL=bencode.js.map