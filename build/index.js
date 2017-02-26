"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const torrent_1 = require("./torrent");
const parsing_1 = require("./parsing");
const peer_1 = require("./peer");
const pieces_1 = require("./pieces");
let buffer = fs.readFileSync("test.torrent", "Latin1");
let torrent = new torrent_1.TorrentFile(buffer);
let requestUrl = torrent.buildTrackerRequestUrl("-DB1000-012345678901", 6999, "started");
http.get(requestUrl);
let request = http.get(requestUrl, function (res) {
    console.log("STATUS: " + res.statusCode);
    console.log("HEADERS: " + JSON.stringify(res.headers));
    // Buffer the body entirely for processing as a whole.
    let bodyChunks = [];
    res.on("data", function (chunk) {
        // You can process streamed parts here...
        bodyChunks.push(chunk);
    }).on("end", function () {
        let body = Buffer.concat(bodyChunks);
        console.log("BODY: " + body);
        let binStr = body.toString("Latin1");
        // ...and/or process the entire body here.
        let parser = new parsing_1.BencodedParser(binStr);
        let parsed = parser.parse();
        let peers = parsed.value["peers"].value;
        let infoHash = torrent.computeInfoHash();
        let pieceManager = new pieces_1.PieceManager(torrent);
        for (let p in peers) {
            let torrentPeer = peers[p].value;
            let peerIp = torrentPeer["ip"] && torrentPeer["ip"].value;
            let peerId = torrentPeer["peer id"] && torrentPeer["peer id"].value;
            let peerPort = torrentPeer["port"] && torrentPeer["port"].value;
            let peer = new peer_1.Peer(peerIp, peerPort, pieceManager);
            peer.connect().then(p => p.sendHandshake(infoHash.toString()));
        }
    });
});
request.on("error", function (e) {
    console.log("ERROR: " + e.message);
});
//# sourceMappingURL=index.js.map