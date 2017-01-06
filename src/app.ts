import { TorrentFile } from "./torrent";
import { BencodedParser, IBencodedParser } from "./parsing";
import { Socket } from "./networkio";
import { Handshake } from "./messages";
import { Peer } from "./peer";
import { PieceManager } from "./pieceManager";

 chrome.fileSystem.chooseEntry({type:"saveFile"},e => {
                                        window["entry"] = e;
                                    });

let fileInput = document.getElementById("file-input") as HTMLInputElement;
fileInput.onchange = () => {
    if (fileInput.files) {
        let reader = new FileReader();
        reader.onloadend = (event) => {
            let buffer = (event.target as FileReader).result as ArrayBuffer;
            let torrent = new TorrentFile(buffer);
            // console.log(torrent);
            let requestUrl = torrent.buildTrackerRequestUrl("-DB1000-012345678901", 6889, "started");
            window["pieceManager"] = new PieceManager(torrent);
            window["piece length"] = torrent.pieceLength;
            window["torrent size"] = torrent.size;

            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                    let binStr = xhr.responseText;

                    let parser = new BencodedParser(binStr);
                    let parsed = parser.parse();
                    let peers = parsed.value["peers"].value;
                    for (let p in peers) {
                        let peer = peers[p].value;
                        let peerIp = peer["ip"] && peer["ip"].value;
                        let peerId = peer["peer id"] && peer["peer id"].value;
                        let peerPort = peer["port"] && peer["port"].value;
                        // console.log(peerIp + " " + peerId + " " + peerPort);

                        // let handshake = new Handshake(torrent.computeInfoHash());

                        request(torrent.computeInfoHash(), peerIp, peerPort, peerId);
                    }
                };
            };

            xhr.overrideMimeType("text/plain;charset=ISO-8859-1");
            xhr.open("GET", requestUrl);
            xhr.send();
        };
        reader.readAsArrayBuffer(fileInput.files[0]);
    };
};



function request(infoHash: string, peerIp: string, peerPort: number, expectedPeerId: string) {
    let data: number[] = [];
    // console.log(infoHash);
    let peer = new Peer(peerIp, peerPort,   window["pieceManager"]);
    peer.connect()
        .then(p => p.sendHandshake(infoHash))
}

function string2ArrayBuffer(string, callback) {
    let bb = new Blob([string]);
    let f = new FileReader();
    f.onload = function(e: any) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
}
