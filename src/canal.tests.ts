///<reference path="../build/canal.d.ts" />
///<reference path="jasmine.d.ts" />

"use strict";

describe("Subscription Tests:", () => {

    it("Throws when attempting to subscribe with a string", () => {
        expect(() => {
            canal.subscribe("myString", () => {
            });
        }).toThrow();
    });

    it("Subscribes with a valid identifier", () => {
        expect(() => {
            canal.subscribe({id: 1619}, () => {
            });
        }).not.toThrow();
    });
});

describe("Publication Tests:", () => {

    it("Throws when attempting to publish with a string", () => {
        expect(() => {
            canal.publish("myString", () => {
            });
        }).toThrow();
    });

    it("Publishes with a valid identifier", () => {
        expect(() => {
            canal.publish({id: 1619}, "bar");
        }).not.toThrow();
    });
});

describe("Topic Tests:", () => {
    it("Expects a created topic to have the proper name", () => {
        var topicName = "CanalRocks";
        var topic = canal.topic(topicName);

        expect(topic.name).toEqual(topicName)
    });

    it("Expects to throw when given a non-string name", () => {
        expect(() => {
            (<any>canal).topic({foo: 1}, () => {
            });
        }).toThrow();
    });

    it("Expects two topic calls with same name to return same topic", () => {
        var topicName = "CanalRocks";
        var topic1 = canal.topic(topicName);
        var topic2 = canal.topic(topicName);
        var theyEqual = topic1 === topic2;

        expect(theyEqual).toEqual(true);
    });
});