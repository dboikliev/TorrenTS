import * as fs from "fs";
import * as http from "http";

import { TorrentFile } from "./torrent";
import { BencodedParser, IBencodedParser } from "./parsing";
import { Socket } from "./networkio";
import { Handshake } from "./messages";
import { Peer } from "./peer";
import { PieceManager } from "./pieces";

let buffer = fs.readFileSync("/users/deyan/Downloads/test.torrent", "Latin1");
let torrent = new TorrentFile(buffer);

let requestUrl = torrent.buildTrackerRequestUrl("-DB1000-012345678901", 6999, "started");

http.get(requestUrl);

let request = http.get(requestUrl, function(res) {
    console.log("STATUS: " + res.statusCode);
    console.log("HEADERS: " + JSON.stringify(res.headers));

    let bodyChunks = [];
    res.on("data", function(chunk) {
        bodyChunks.push(chunk);
        }).on("end", function() {
            let body = Buffer.concat(bodyChunks);
            // console.log("BODY: " + body);
            let binStr = body.toString("Latin1");
            let parser = new BencodedParser(binStr);
            let parsed = parser.parse();
            let peers = parsed.value["peers"].value;
            let infoHash = torrent.computeInfoHash();
            let pieceManager = new PieceManager(torrent);
            for (let p in peers) {
                let torrentPeer = peers[p].value;
                let peerIp = torrentPeer["ip"] && torrentPeer["ip"].value;
                let peerId = torrentPeer["peer id"] && torrentPeer["peer id"].value;
                let peerPort = torrentPeer["port"] && torrentPeer["port"].value;

                let peer = new Peer(peerIp, peerPort, pieceManager);
                peer.connect().then(p => p.sendHandshake(infoHash.toString()));
            }
      });
});

request.on("error", function(e) {
  console.log("ERROR: " + e.message);
});

