"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bencode_1 = require("./bencode");
class TokenIdentifiers {
}
TokenIdentifiers.Integer = "i";
TokenIdentifiers.Dictionary = "d";
TokenIdentifiers.List = "l";
TokenIdentifiers.End = "e";
class BencodedParser {
    constructor(bencodedContent) {
        this.currentPosition = 0;
        this.bencodedContent = bencodedContent;
    }
    parse() {
        let length = this.bencodedContent.length;
        let result = null;
        while (this.currentPosition < length) {
            switch (this.bencodedContent[this.currentPosition]) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    result = this.parseString();
                    return result;
                case TokenIdentifiers.Integer:
                    result = this.parseInteger();
                    return result;
                case TokenIdentifiers.Dictionary:
                    result = this.parseDictionary();
                    return result;
                case TokenIdentifiers.List:
                    result = this.parseList();
                    return result;
                default:
                    throw new Error(`Unknown token: '${this.bencodedContent[this.currentPosition]}' at position ${this.currentPosition}.`);
            }
        }
        return result;
    }
    parseString() {
        let indexOfSeparator = this.bencodedContent.indexOf(":", this.currentPosition);
        let stringLength = parseInt(this.bencodedContent.substring(this.currentPosition, indexOfSeparator));
        let stringToken = this.bencodedContent.substr(indexOfSeparator + 1, stringLength);
        this.currentPosition = indexOfSeparator + stringLength + 1;
        return new bencode_1.BencodedString(stringToken);
    }
    parseInteger() {
        let start = this.currentPosition + 1;
        let endIndex = this.bencodedContent.indexOf(TokenIdentifiers.End, start);
        let length = endIndex - start;
        let stringToken = this.bencodedContent.substr(start, length);
        this.currentPosition = endIndex + 1;
        return new bencode_1.BencodedInteger(parseInt(stringToken));
    }
    parseList() {
        let list = new bencode_1.BencodedList();
        this.currentPosition++;
        while (this.currentPosition < this.bencodedContent.length &&
            this.bencodedContent[this.currentPosition] !== TokenIdentifiers.End) {
            let bencoedObject = this.parse();
            list.add(bencoedObject);
        }
        this.currentPosition++;
        return list;
    }
    parseDictionary() {
        let dict = new bencode_1.BencodedDictionary();
        this.currentPosition++;
        while (this.currentPosition < this.bencodedContent.length &&
            this.bencodedContent[this.currentPosition] !== TokenIdentifiers.End) {
            let key = this.parse();
            let bencoedObject = this.parse();
            dict.add(key, bencoedObject);
        }
        this.currentPosition++;
        return dict;
    }
}
exports.BencodedParser = BencodedParser;
//# sourceMappingURL=parsing.js.map