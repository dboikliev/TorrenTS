import { BencodedDictionary, BencodedInteger, BencodedList, BencodedObject, BencodedString, IBencodedObject } from "../src/bencode";
import { BencodedParser } from "../src/parsing";

describe("Bencoded parser tests", () => {
    it("i42e is parsed as the integer 42.", () => {
        let parser = new BencodedParser("i42e");
        let parsedObject = parser.parse() as BencodedInteger;
        expect(parsedObject.value).toEqual(42);
    });

    it("9:abcdefghi is parsed as the string abcdefghi", () => {
        let parser = new BencodedParser("9:abcdefghi");
        let parsedObject = parser.parse() as BencodedString;
        expect(parsedObject.value).toEqual("abcdefghi");
    });

    it("0: is parsed as the empty string", () => {
        let parser = new BencodedParser("0:");
        let parsedObject = parser.parse() as BencodedString;
        expect(parsedObject.value).toEqual("");
    });

    it("10:1234567890 is parsed as 1234567890", () => {
        let parser = new BencodedParser("10:1234567890");
        let parsedObject = parser.parse() as BencodedString;
        expect(parsedObject.value).toEqual("1234567890");
    });

    it("14:1234567890 123 is parsed as 1234567890 123", () => {
        let parser = new BencodedParser("14:1234567890 123");
        let parsedObject = parser.parse() as BencodedString;
        expect(parsedObject.value).toEqual("1234567890 123");
    });

    it("14:1234567890:123 is parsed as 1234567890:123", () => {
        let parser = new BencodedParser("14:1234567890:123");
        let parsedObject = parser.parse() as BencodedString;
        expect(parsedObject.value).toEqual("1234567890:123");
    });

    it("l4:1234e is parsed as a list containing the string 1234", () => {
        let parser = new BencodedParser("l4:1234e");
        let parsedObject = parser.parse() as BencodedList;
        parsedObject.value.forEach((element: BencodedString) => {
            expect(element.value).toEqual("1234");
        });
    });

    it("l4:12343:abce is parsed as a list containing the string 1234 and abc", () => {
        let parser = new BencodedParser("l4:12343:abce");
        let parsedObject = parser.parse() as BencodedList;
        let elements = parsedObject.value as BencodedString[];
        expect(elements[0].value).toEqual("1234");
        expect(elements[1].value).toEqual("abc");
    });

    it("l4:12343:abci42ee is parsed as a list containing 1234, abc and 42", () => {
        let parser = new BencodedParser("l4:12343:abci42ee");
        let parsedObject = parser.parse() as BencodedList;
        let elements = parsedObject.value as BencodedString[];
        expect(elements[0].value).toEqual("1234");
        expect(elements[1].value).toEqual("abc");
        expect(elements[2].value).toEqual(42);
    });

    it("l4:12343:abci42el4:12343:abci42eee is parsed as a list containing 1234, abc, 42 AND a list containing 1234, abc, 42", () => {
        let parser = new BencodedParser("l4:12343:abci42el4:12343:abci42eee");
        let parsedObject = parser.parse() as BencodedList;
        let elements = parsedObject.value;
        expect(elements.length).toEqual(4);
        expect(elements[0].value).toEqual("1234");
        expect(elements[1].value).toEqual("abc");
        expect(elements[2].value).toEqual(42);
        let nestedElements = elements[3].value as BencodedObject<IBencodedObject>;
        expect(nestedElements[0].value).toEqual("1234");
        expect(nestedElements[1].value).toEqual("abc");
        expect(nestedElements[2].value).toEqual(42);
    });

    it("d3:cow3:moo4:spam4:eggse is parsed as the dictionary { 'cow' => 'moo', 'spam' => 'eggs' }", () => {
        let parser = new BencodedParser("d3:cow3:moo4:spam4:eggse");
        let parsedObject = parser.parse() as BencodedDictionary;
        expect(parsedObject.value["cow"].value).toEqual("moo");
        expect(parsedObject.value["spam"].value).toEqual("eggs");
    });

    it("de is parsed as the dictionary {}", () => {
        let parser = new BencodedParser("de");
        let parsedObject = parser.parse() as BencodedDictionary;
        expect(parsedObject.value).toEqual({});
    });

    it("d3:keydee is parsed as the dictionary { 'key' => {} }", () => {
        let parser = new BencodedParser("d3:keydee");
        let parsedObject = parser.parse() as BencodedDictionary;
        expect(parsedObject.value["key"].value).toEqual({});
    });

    it("d3:keyd9:inner_keyi42ee is parsed as the dictionary { 'key' => { 'inner_key' => 42 } }", () => {
        let parser = new BencodedParser("d3:keyd9:inner_keyi42ee");
        let parsedObject = parser.parse() as BencodedDictionary;
        expect(parsedObject.value["key"].value["inner_key"].value).toEqual(42);
    });

    it("li0ed3:keyd9:inner_keyi42eeee is parsed as list containing the integer 0 and the dictionary { 'key' => { 'inner_key' => 42 } }", () => {
        let parser = new BencodedParser("li0ed3:keyd9:inner_keyi42ee");
        let parsedObject = parser.parse() as BencodedList;
        let integer = parsedObject.value[0] as BencodedInteger;
        expect(integer.value).toEqual(0);
        let dict = parsedObject.value[1] as BencodedDictionary;
        expect(dict.value["key"].value["inner_key"].value).toEqual(42);
    });

    it("d13:file-durationli42ee10:file-mediali-1ei0ei-1ee is parsed as the dictionary { 'file-duration' => [42], 'file-media' => [-1, 0, -1] }", () => {
        let parser = new BencodedParser("d13:file-durationli42ee10:file-mediali-1ei0ei-1ee");
        let parsedObject = parser.parse() as BencodedDictionary;
        let list1 =  parsedObject.value["file-duration"].value;
        let integer = list1[0];
        expect(integer.value).toEqual(42);

        let list2 = parsedObject.value["file-media"].value;
        let integer2 = list2[0].value;
        let integer3 = list2[1].value;
        let integer4 = list2[2].value;
        expect(integer2).toEqual(-1);
        expect(integer3).toEqual(0);
        expect(integer4).toEqual(-1);
    });

    it("d9:publisher3:bob17:publisher-webpage15:www.example.com18:publisher.location4:homee" +
    "is parsed as the dictionary { 'publisher' => 'bob', 'publisher-webpage' => 'www.example.com', 'publisher.location' => 'home' }", () => {
        let parser = new BencodedParser("d9:publisher3:bob17:publisher-webpage15:www.example.com18:publisher.location4:homee");
        let parsedObject = parser.parse() as BencodedDictionary;
        expect(parsedObject.value["publisher"].value).toEqual("bob");
        expect(parsedObject.value["publisher-webpage"].value).toEqual("www.example.com");
        expect(parsedObject.value["publisher.location"].value).toEqual("home");
    });
});