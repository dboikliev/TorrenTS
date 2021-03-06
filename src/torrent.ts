import { BencodedDictionary, BencodedInteger, BencodedList, BencodedObject, BencodedString, IBencodedObject} from "./bencode";
import { BencodedParser } from "./parsing";
import * as CryptoJS from "crypto-js";

export class TorrentFile {
    private buffer: Uint8Array;
    private dictionary: BencodedDictionary;

    constructor(buffer: ArrayBuffer | string) {
        let parser;
        if (buffer instanceof ArrayBuffer) {
            let content = "";
            if (ArrayBuffer.isView(buffer)) {
                this.buffer = new Uint8Array(buffer);
            } else {
                let data_str = new Uint8Array(buffer);
                for (let i = 0; i < data_str.length; ++i) {
                    content += String.fromCharCode(data_str[i]);
                }
            }
            parser = new BencodedParser(content);
        }
        else if (typeof buffer === "string") {
            parser = new BencodedParser(buffer);
        }
        this.dictionary = parser.parse() as BencodedDictionary;
    }

    get info(): BencodedDictionary {
        return this.dictionary.value["info"] as BencodedDictionary;
    }

    get announce(): string {
        return this.dictionary.value["announce"].value;
    }

    get announceList(): string[] {
        return this.dictionary.value["announce-list"].value;
    }

    get creationDate(): string {
        return this.dictionary.value["creation date"].value;
    }

    get comment(): string {
        return this.dictionary.value["comment"].value;
    }

    get createdBy(): string {
        return this.dictionary.value["created by"].value;
    }

    get encoding(): string {
        return this.dictionary.value["encoding"].value;
    }

    get pieceLength(): number {
        return this.dictionary.value["info"].value["piece length"].value;
    }

    get pieces(): string[] {
        return this.dictionary.value["info"].value["pieces"].value;
    }

    get size(): number {
        let files = this.info.value["files"];
        if (files) {
            return files.value
                .map(item => item.value.length.value)
                .reduce((prev, cur) => prev + cur);
        }
        
        return this.info.value["length"].value;
    }

    computeInfoHash(): string {
        let encoded = this.info.encode();
        let latin1 = CryptoJS.enc.Latin1.parse(encoded);
        let sha1 = CryptoJS.SHA1(latin1).toString();
        
        return sha1;
    }

    computeUrlEncodedInfoHash(): string {
        let sha = this.computeInfoHash();
        console.log(sha);
        return sha.replace(/(.{2})/g, "%\$1");
    }

    // TODO: Extract the parameters into an object and build the url dynamically..
    buildTrackerRequestUrl(peerId: string, port: number,  event: string): string {
        return `${ this.announce }&info_hash=${ this.computeUrlEncodedInfoHash() }&peer_id=${ peerId }&port=${ port }&event=${ event }&left=${ this.size }`;
    }
}