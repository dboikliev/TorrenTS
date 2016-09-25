import {Torrent} from "./torrent";
import { BencodedParser, IBencodedParser } from "./parsing";
import {NetworkIO} from "./networkio";
import { Handshake } from "./messages";

let fileInput = document.getElementById("file-input") as HTMLInputElement;
fileInput.onchange = () => {
    if (fileInput.files) {
        let reader = new FileReader();
        reader.onload = (event) => {
            let buffer = (event.target as FileReader).result as ArrayBuffer;
            let torrent = new Torrent.TorrentFile(buffer);
            let requestUrl = torrent.buildTrackerRequestUrl("-DB1000-012345678901", 6889, "started");

            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
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

                        let handshake = new Handshake(torrent.computeInfoHash());

                        request(handshake, peerIp, peerPort, peerId);
                    }
                };
            };

            xhr.open("get", requestUrl);
            xhr.overrideMimeType("text/plain;charset=ISO-8859-1");
            xhr.send();
        };
        reader.readAsArrayBuffer(fileInput.files[0]);
    };
};

function request(message: Handshake, peerIp: string, peerPort: number, expectedPeerId: string) {
    let data: number[] = [];
    NetworkIO.Socket.create(peerIp, peerPort)
        .then(socket => socket.connect())
        .then(socket => socket.send(message.data))
        .then(socket => Handshake.parse(socket.received.slice(0, 68)))
        .catch(error => console.log(error));

    function processData(data) {
        let v = new Uint8Array(data);
        console.log(v);
    }
}

function string2ArrayBuffer(string, callback) {
    let bb = new Blob([string]);
    let f = new FileReader();
    f.onload = function(e: any) {
        callback(e.target.result);
    };
    f.readAsArrayBuffer(bb);
}