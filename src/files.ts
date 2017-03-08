import * as fs from "fs";

export class FileManager {
    private size;
    private readonly fileEntries: IFileEntry[];

    constructor(private path: string, private maxSizeBeforeFlush: number) {
        setInterval(this.flush, 1000);
    }

    write(entry: IFileEntry) {
        this.fileEntries.push(entry);
        this.size += entry.dataLength;

        if (this.size >= this.maxSizeBeforeFlush) {
            this.flush();
        }
    }

    flush() {
        if (this.fileEntries.length) {
            let fd = fs.openSync(this.path, "rs+");
            while (this.fileEntries.length) {
                let entry = this.fileEntries.pop();
                this.size -= entry.dataLength;
                fs.writeSync(fd, new Buffer(entry.data), entry.dataOffset, entry.dataLength, entry.filePosition);
            }
            fs.closeSync(fd);
        }
    }
}

export interface IFileEntry {
    data: ArrayBuffer;
    dataOffset: number;
    dataLength: number;
    filePosition: number;
}