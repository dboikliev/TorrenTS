export namespace BencodeObjects {
    export interface IBencodedObject {
        value;
        encode(): string;
    }

    export abstract class BencodedObject<T> implements IBencodedObject {
        public value: T;

        constructor(value: T) {
            this.value = value;
        }

        abstract encode(): string;
    }

    export class BencodedString extends BencodedObject<string> {
        public encode(): string {
            return `${ this.value.length }:${ this.value }`;
        }
    }

    export class BencodedInteger extends BencodedObject<number> {
        public encode(): string {
            return `i${ this.value }e`;
        }
    }

    export class BencodedList extends BencodedObject<IBencodedObject[]> {
        constructor(value: IBencodedObject[] = []) {
            super(value);
        }

        public add(object: IBencodedObject): void {
            this.value.push(object);
        }

        public encode(): string {
            let encodedList = "l";
            this.value.forEach((value) => {
                encodedList += value.encode();
            });
            encodedList += "e";
            return encodedList;
        }
    }

    export class BencodedDictionary extends BencodedObject<{ [key: string]: IBencodedObject }> {
        constructor(value: { [key: string]: IBencodedObject } = {}) {
            super(value);
        }

        public add(key: BencodedString, value: IBencodedObject): void {
            this.value[key.value] = value;
        }

        public encode(): string {
            let encodedDictionary = "d";
            let keys = Object.getOwnPropertyNames(this.value);
            keys.forEach((key) => {
                let encodedKeyValuePair = `${new BencodedString(key).encode()}${this.value[key].encode()}`;
                encodedDictionary += encodedKeyValuePair;
            });
            encodedDictionary += "e";
            return encodedDictionary;
        }
    }
}