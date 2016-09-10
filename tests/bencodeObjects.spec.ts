import {BencodeObjects} from "../src/bencode";

describe("Bencoded objects tests", () => {
    it("BencodedInteger value equals 1", () => expect(new BencodeObjects.BencodedInteger(1).value).toEqual(1));
    it("BencdoedList value is equal to list", () => {
        let objects = [ new BencodeObjects.BencodedInteger(1), new BencodeObjects.BencodedString("str")];
        expect(new BencodeObjects.BencodedList(objects.slice()).value).toEqual(objects);
    });
});