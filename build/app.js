"use strict";
var torrent_1 = require("./torrent");
var parsing_1 = require("./parsing");
var peer_1 = require("./peer");
var pieces_1 = require("./pieces");
chrome.fileSystem.chooseEntry({ type: "saveFile" }, function (e) {
    window["entry"] = e;
});
var fileInput = document.getElementById("file-input");
fileInput.onchange = function () {
    if (fileInput.files) {
        var reader = new FileReader();
        reader.onloadend = function (event) {
            var buffer = event.target.result;
            var torrent = new torrent_1.TorrentFile(buffer);
            // console.log(torrent);
            var requestUrl = torrent.buildTrackerRequestUrl("-DB1000-012345678901", 6889, "started");
            window["pieceManager"] = new pieces_1.PieceManager(torrent);
            window["piece length"] = torrent.pieceLength;
            window["torrent size"] = torrent.size;
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    var binStr = xhr.responseText;
                    var parser = new parsing_1.BencodedParser(binStr);
                    var parsed = parser.parse();
                    var peers = parsed.value["peers"].value;
                    for (var p in peers) {
                        var peer = peers[p].value;
                        var peerIp = peer["ip"] && peer["ip"].value;
                        var peerId = peer["peer id"] && peer["peer id"].value;
                        var peerPort = peer["port"] && peer["port"].value;
                        // console.log(peerIp + " " + peerId + " " + peerPort);
                        // let handshake = new Handshake(torrent.computeInfoHash());
                        request(torrent.computeInfoHash(), peerIp, peerPort, peerId);
                    }
                }
                ;
            };
            xhr.overrideMimeType("text/plain;charset=ISO-8859-1");
            xhr.open("GET", requestUrl);
            xhr.send();
        };
        reader.readAsArrayBuffer(fileInput.files[0]);
    }
    ;
};
function request(infoHash, peerIp, peerPort, expectedPeerId) {
    var data = [];
    // console.log(infoHash);
    var peer = new peer_1.Peer(peerIp, peerPort, window["pieceManager"]);
    peer.connect().then(function (p) { return p.sendHandshake(infoHash); });
}
function string2ArrayBuffer(string, callback) {
    var bb = new Blob([string]);
    var f = new FileReader();
    f.onload = function (e) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
}
//# sourceMappingURL=app.js.map