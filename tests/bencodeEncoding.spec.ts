import { BencodedDictionary, BencodedInteger, BencodedList, BencodedObject, BencodedString, IBencodedObject } from "../src/bencode";

describe("Bencode encoding", () => {
    it("42 is encoded as i42e", () => {
        let bencodeObject = new BencodedInteger(42);
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("i42e");
    });

    it("sometxt is encoded as 7:sometxt", () => {
        let bencodeObject = new BencodedString("sometxt");
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("7:sometxt");
    });

    it("Empty string is encoded as 0:", () => {
        let bencodeObject = new BencodedString("");
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("0:");
    });

    it("[42, sometxt] is encoded as li42e7:sometxte", () => {
        let bencodeObject = new BencodedList([new BencodedInteger(42), new BencodedString("sometxt")]);
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("li42e7:sometxte");
    });

    it("[42, [42, sometxt], sometxt] is encoded as li42eli42e7:sometxte7:sometxte", () => {
        let bencodeObject = new BencodedList([new BencodedInteger(42),
            new BencodedList([new BencodedInteger(42),
                new BencodedString("sometxt")]),
            new BencodedString("sometxt")]);
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("li42eli42e7:sometxte7:sometxte");
    });

    it("{} is encoded as de", () => {
        let bencodeObject = new BencodedDictionary();
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("de");
    });

    it("{ 'number' => 42 } is encoded as d6:numberi42ee", () => {
        let bencodeObject = new BencodedDictionary({ "number" : new BencodedInteger(42) });
        let encoded = bencodeObject.encode();
        expect(encoded).toEqual("d6:numberi42ee");
    });
});