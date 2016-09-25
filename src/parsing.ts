import { IBencodedObject, BencodedDictionary, BencodedInteger, BencodedList, BencodedObject, BencodedString } from "./bencode";

export interface IBencodedParser {
    parse(): IBencodedObject;
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

    public parse(): IBencodedObject {
        let length = this.bencodedContent.length;
        let result: IBencodedObject = null;
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

    private parseString(): BencodedString {
        let indexOfSeparator = this.bencodedContent.indexOf(":", this.currentPosition);
        let stringLength = parseInt(this.bencodedContent.substring(this.currentPosition, indexOfSeparator));
        let stringToken = this.bencodedContent.substr(indexOfSeparator + 1, stringLength);
        this.currentPosition = indexOfSeparator + stringLength + 1;
        return new BencodedString(stringToken);
    }

    private parseInteger(): BencodedInteger {
        let start = this.currentPosition + 1;
        let endIndex = this.bencodedContent.indexOf(TokenIdentifiers.End, start);
        let length = endIndex - start;
        let stringToken = this.bencodedContent.substr(start, length);
        this.currentPosition = endIndex + 1;
        return new BencodedInteger(parseInt(stringToken));
    }

    private parseList(): BencodedList {
        let list = new BencodedList();
        this.currentPosition++;
        while (this.currentPosition < this.bencodedContent.length &&
            this.bencodedContent[this.currentPosition] !== TokenIdentifiers.End) {
            let bencoedObject = this.parse();
            list.add(bencoedObject);
        }
        this.currentPosition++;
        return list;
    }

    private parseDictionary(): BencodedDictionary {
        let dict = new BencodedDictionary();
            this.currentPosition++;
        while (this.currentPosition < this.bencodedContent.length &&
            this.bencodedContent[this.currentPosition] !== TokenIdentifiers.End) {
            let key = this.parse() as BencodedString;
            let bencoedObject = this.parse();
            dict.add(key, bencoedObject);
        }
        this.currentPosition++;
        return dict;
    }
}