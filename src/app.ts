import {Torrent} from "./torrent";
import {Parsing} from "./parsing";
import {NetworkIO} from "./networkio";
import {Messages} from "./messages";

let fileInput = document.getElementById("file-input") as HTMLInputElement;
fileInput.onchange = () => {
    if (fileInput.files) {
        let reader = new FileReader();
        reader.onload = (event) => {
            let buffer = (event.target as FileReader).result as ArrayBuffer;
            let torrent = new Torrent.TorrentFile(buffer);
            let requestUrl = torrent.buildTrackerRequestUrl("-DB1000-012345678901", 6889, "started");

            // chrome.sockets.tcpServer.create(info => {
            //     chrome.sockets.tcpServer.onAccept.addListener(data => {
            //     });
            //     chrome.sockets.tcpServer.listen(info.socketId, "0.0.0.0", 6889, result => {
            //         console.log("TCP listener", result);
            //     });
            // });

            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    let binStr = xhr.responseText;

                    let parser = new Parsing.BencodedParser(binStr);
                    let parsed = parser.parse();
                    let peers = parsed.value["peers"].value;
                    for (let p in peers) {
                        let peer = peers[p].value;
                        let peerIp = peer["ip"] && peer["ip"].value;
                        let peerId = peer["peer id"] && peer["peer id"].value;
                        let peerPort = peer["port"] && peer["port"].value;
                        // console.log(peerIp + " " + peerId + " " + peerPort);
                        let arr = [19];

                        let msg = "BitTorrent protocol";
                        for (let i = 0; i < msg.length; i++) {
                            arr.push(msg.charCodeAt(i));
                        }

                        arr.push(0, 0, 0, 0, 0, 0, 0, 0);

                        torrent.computeInfoHash().match(/.{2}/g).forEach(element => {
                            arr.push(parseInt(element, 16));
                        });

                        let myid = "-DB1000-012345678901";
                        for (let i = 0; i < myid.length; i++) {
                            arr.push(myid.charCodeAt(i));
                        }

                        request(arr, peerIp, peerPort, peerId);
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

function request(arr: number[], peerIp: string, peerPort: number, expectedPeerId: string) {
    let view = new Uint8Array(arr);
    let data = view.buffer;

    NetworkIO.Socket.create(peerIp, peerPort)
        .then(socket => socket.connect())
        .then(socket => socket.send(data))
        .then(socket => {
            processData(socket.received);
            return socket;
        })
        .then(socket => {
            let data = new Messages.Unchoke().data;
            console.log(data.byteLength);
            socket.send(data);
            return socket;
        })
        .then(socket => {
            processData(socket.received)
            return socket;
        })
        .then(socket => socket.send(new Messages.Interested().data))
        .then(socket => {
            // console.log(socket.received)
            processData(socket.received);
            return socket;
        })
        .catch(error => console.log(error));

    function processData(data) {
        let v = new Uint8Array(data);
        console.log(v);
        // let equal = true;

        // for (let i = 28; i < 49; i++) {
        //     if (view[i] !== v[i]) {
        //         equal = false;
        //         break;
        //     }
        // }
        // if (equal) {
        //     let receivedId = "";

        //     string2ArrayBuffer(expectedPeerId, (e) => {
        //         let buf = new Uint8Array(e);
        //         let areEqual = true;
        //         for (let i = 48; i < 69; i++) {
        //             receivedId += String.fromCharCode(v[i]);
        //             if (v[i] !== buf[i - 48]) {
        //                 areEqual = false;
        //                 break;
        //             }
        //         }

        //         console.log(receivedId + " " + expectedPeerId)
        //         console.log(`Peer id is correct: ${ receivedId === expectedPeerId }`)
        //     });
        // }
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