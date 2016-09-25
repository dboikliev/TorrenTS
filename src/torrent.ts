import { BencodedDictionary, BencodedInteger, BencodedList, BencodedObject, BencodedString, IBencodedObject} from "./bencode";
import { BencodedParser } from "./parsing";
import * as CryptoJS from "crypto-js";

export namespace Torrent {
    export class TorrentFile {
        private buffer: Uint8Array;
        private dictionary: BencodedDictionary;

        constructor(buffer: ArrayBuffer) {
            let content = "";
            if (ArrayBuffer.isView(buffer)) {
                this.buffer = new Uint8Array(buffer);
            } else {
                let data_str = new Uint8Array(buffer);
                for (let i = 0; i < data_str.length; ++i) {
                    content += String.fromCharCode(data_str[i]);
                }
            }
            let parser = new BencodedParser(content);
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
            return this.dictionary.value["piece length"].value;
        }

        get pieces(): string[] {
            return this.dictionary.value["info"].value["pieces"].value;
        }

        computeInfoHash(): string {
            return CryptoJS.SHA1(CryptoJS.enc.Latin1.parse(this.info.encode())).toString();
        }

        computeUrlEncodedInfoHash(): string {
            let sha = this.computeInfoHash();
            return sha.replace(/(.{2})/g, "%\$1");
        }

        // TODO: Extract the parameters into an object and build the url dynamically..
        buildTrackerRequestUrl(peerId: string, port: number,  event: string): string {
            return `${ this.announce }&info_hash=${ this.computeUrlEncodedInfoHash() }&peer_id=${ peerId }&port=${ port }&event=${ event }`;
        }
    }
}