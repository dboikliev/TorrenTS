import { BencodedList, BencodedObject, BencodedDictionary, BencodedInteger, BencodedString } from "../src/bencode";

describe("Bencoded objects tests", () => {
    it("BencodedInteger value equals 1", () => expect(new BencodedInteger(1).value).toEqual(1));
    it("BencdoedList value is equal to list", () => {
        let objects = [ new BencodedInteger(1), new BencodedString("str")];
        expect(new BencodedList(objects.slice()).value).toEqual(objects);
    });
});