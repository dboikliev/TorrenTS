"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsing_1 = require("./parsing");
const CryptoJS = require("crypto-js");
class TorrentFile {
    constructor(buffer) {
        let parser;
        if (buffer instanceof ArrayBuffer) {
            let content = "";
            if (ArrayBuffer.isView(buffer)) {
                this.buffer = new Uint8Array(buffer);
            }
            else {
                let data_str = new Uint8Array(buffer);
                for (let i = 0; i < data_str.length; ++i) {
                    content += String.fromCharCode(data_str[i]);
                }
            }
            parser = new parsing_1.BencodedParser(content);
        }
        else if (typeof buffer === "string") {
            parser = new parsing_1.BencodedParser(buffer);
        }
        this.dictionary = parser.parse();
    }
    get info() {
        return this.dictionary.value["info"];
    }
    get announce() {
        return this.dictionary.value["announce"].value;
    }
    get announceList() {
        return this.dictionary.value["announce-list"].value;
    }
    get creationDate() {
        return this.dictionary.value["creation date"].value;
    }
    get comment() {
        return this.dictionary.value["comment"].value;
    }
    get createdBy() {
        return this.dictionary.value["created by"].value;
    }
    get encoding() {
        return this.dictionary.value["encoding"].value;
    }
    get pieceLength() {
        return this.dictionary.value["info"].value["piece length"].value;
    }
    get pieces() {
        return this.dictionary.value["info"].value["pieces"].value;
    }
    get size() {
        let files = this.info.value["files"];
        if (files) {
            return files.value
                .map(item => item.value.length.value)
                .reduce((prev, cur) => prev + cur);
        }
        else {
            return this.info.value["length"].value;
        }
    }
    computeInfoHash() {
        return CryptoJS.SHA1(CryptoJS.enc.Latin1.parse(this.info.encode())).toString();
    }
    computeUrlEncodedInfoHash() {
        let sha = this.computeInfoHash();
        console.log(sha);
        return sha.replace(/(.{2})/g, "%\$1");
    }
    // TODO: Extract the parameters into an object and build the url dynamically..
    buildTrackerRequestUrl(peerId, port, event) {
        return `${this.announce}&info_hash=${this.computeUrlEncodedInfoHash()}&peer_id=${peerId}&port=${port}&event=${event}&left=${this.size}`;
    }
}
exports.TorrentFile = TorrentFile;
//# sourceMappingURL=torrent.js.map