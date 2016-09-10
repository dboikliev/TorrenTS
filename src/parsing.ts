import {BencodeObjects} from "./bencode";

export namespace Parsing {
    export interface IBencodedParser {
        parse(): BencodeObjects.IBencodedObject;
    }

    class TokenIdentifiers {
        public static Integer = "i";
        public static Dictionary = "d";
        public static List = "l";
        public static End = "e";
    }

    export class BencodedParser implements IBencodedParser {
        private bencodedContent: string;
        private currentPosition: number = 0;

        constructor(bencodedContent: string) {
            this.bencodedContent = bencodedContent;
        }

        public parse(): BencodeObjects.IBencodedObject {
            let length = this.bencodedContent.length;
            let result: BencodeObjects.IBencodedObject = null;
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
                        throw new Error(`Unknown token: '${ this.bencodedContent[this.currentPosition] }' at position ${ this.currentPosition }.`);
                }
            }
            return result;
        }

        private parseString(): BencodeObjects.BencodedString {
            let indexOfSeparator = this.bencodedContent.indexOf(":", this.currentPosition);
            let stringLength = parseInt(this.bencodedContent.substring(this.currentPosition, indexOfSeparator));
            let stringToken = this.bencodedContent.substr(indexOfSeparator + 1, stringLength);
            this.currentPosition = indexOfSeparator + stringLength + 1;
            return new BencodeObjects.BencodedString(stringToken);
        }

        private parseInteger(): BencodeObjects.BencodedInteger {
            let start = this.currentPosition + 1;
            let endIndex = this.bencodedContent.indexOf(TokenIdentifiers.End, start);
            let length = endIndex - start;
            let stringToken = this.bencodedContent.substr(start, length);
            this.currentPosition = endIndex + 1;
            return new BencodeObjects.BencodedInteger(parseInt(stringToken));
        }

        private parseList(): BencodeObjects.BencodedList {
            let list = new BencodeObjects.BencodedList();
            this.currentPosition++;
            while (this.currentPosition < this.bencodedContent.length &&
                this.bencodedContent[this.currentPosition] !== TokenIdentifiers.End) {
                let bencoedObject = this.parse();
                list.add(bencoedObject);
            }
            this.currentPosition++;
            return list;
        }

        private parseDictionary(): BencodeObjects.BencodedDictionary {
            let dict = new BencodeObjects.BencodedDictionary();
             this.currentPosition++;
            while (this.currentPosition < this.bencodedContent.length &&
                this.bencodedContent[this.currentPosition] !== TokenIdentifiers.End) {
                let key = this.parse() as BencodeObjects.BencodedString;
                let bencoedObject = this.parse();
                dict.add(key, bencoedObject);
            }
            this.currentPosition++;
            return dict;
        }
    }
}