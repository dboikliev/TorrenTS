namespace Peers {
    class Peer {
        private ip: string;
        private port: number;
        private id: string;

        constructor(ip: string, port: number, id: string) {
            this.ip = ip;
            this.port = port;
            this.id = id;
        }

        public performHandshake(message: HandshakeMessage) {
        }
    }

    class HandshakeMessage {
        private pstrlen: number;
        private pstr: string;
        private reserved: number[];
        private infoHash: string;
        private peerId: string;

        private bytesArray: Uint8Array;

        constructor(infoHash: string,
            peerId: string,
            pstrlen: number = 19,
            pstr: string = "BitTorrent protocol",
            resevered: number[] = [0, 0, 0, 0, 0, 0, 0, 0]) {
        }

        get bytes(): Uint8Array {
            if (!this.bytesArray) {
                let data = [19];
                for (let i = 0; i < this.pstr.length; i++) {
                    data.push(this.pstr.charCodeAt(i));
                }

                data.push(0, 0, 0, 0, 0, 0, 0, 0);

                this.infoHash.match(/.{2}/g).forEach(element => {
                    data.push(parseInt(element, 16));
                });

                for (let i = 0; i < this.peerId.length; i++) {
                    data.push(this.peerId.charCodeAt(i));
                }
                this.bytesArray = new Uint8Array(data);
            }
            return this.bytesArray;
        }
    }
}