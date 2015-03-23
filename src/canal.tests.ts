///<reference path="../build/canal.d.ts" />
///<reference path="jasmine.d.ts" />

// PhantomJS doesn't have function.bind... very strange...
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {
            },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                        ? this
                        : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

"use strict";
afterEach(() => {
    canal.init();
});

describe("Identifier Tests:", () => {
    it("Throws when attempting to make a key out of a primitive", () => {
        expect(() => {
            canal.makeValidatorKey(1);
        }).toThrow();

        expect(() => {
            canal.makeValidatorKey("foo");
        }).toThrow();

        expect(() => {
            canal.makeValidatorKey(true);
        }).toThrow();
    });

    it("Makes a key out of a a valid identifier", () => {
        expect(() => {
            canal.makeValidatorKey({id: 1619});
        }).not.toThrow();
    });

    it("Properly formats a key", () => {
        var identifier = {name: "Sasha", id: 1619, type: "tweet"};
        var key = canal.makeValidatorKey(identifier);
        expect(key).toEqual('[{"id":1619},{"name":"Sasha"},{"type":"tweet"}]');
    });

    it("Makes two identical identifiers with different orders into same key", () => {
        var identifier1 = {id: 1619, type: "tweet"};
        var key1 = canal.makeValidatorKey(identifier1);
        var identifier2 = {type: "tweet", id: 1619};
        var key2 = canal.makeValidatorKey(identifier2);

        expect(key1).toEqual(key2);
    });
});

describe("Subscription Tests:", () => {
    it("Throws when attempting to subscribe to null", () => {
        expect(() => {
            canal.subscribe(null, () => {
            });
        }).toThrow();

    });

    it("Throws when attempting to subscribe with a primitive", () => {
        expect(() => {
            canal.subscribe("myString", () => {
            });
        }).toThrow();

        expect(() => {
            canal.subscribe(1, () => {
            });
        }).toThrow();

        expect(() => {
            canal.subscribe(true, () => {
            });
        }).toThrow();
    });

    it("Subscribes with a valid identifier", () => {
        expect(() => {
            canal.subscribe({id: 1619}, () => {
            });
        }).not.toThrow();
    });

    it("Unsubscribes with a valid identifier", () => {
        expect(() => {
            var nodeId = canal.subscribe({id: 1619}, () => {
            });
            canal.unsubscribe(nodeId);
        }).not.toThrow();
    });

    it("Throws when attempting to subscribe to an invalid nodeId", () => {
        expect(() => {
            var nodeId = canal.subscribe({id: 1619}, () => {
                }),
                wrongId = 10;

            // if one day we introduce randomness to node ID, and we somehow have the ID of 10...
            if (nodeId === wrongId) {
                nodeId = 0;
            }

            canal.unsubscribe(wrongId);
        }).toThrow();
    });
});

describe("Publication Tests:", () => {
    it("Throws when attempting to publish to null", () => {
        expect(() => {
            canal.publish(null, null);
        }).toThrow();
    });

    it("Throws when attempting to publish with a primitive", () => {
        expect(() => {
            canal.publish("myString", null);
        }).toThrow();

        expect(() => {
            canal.publish(1, null);
        }).toThrow();

        expect(() => {
            canal.publish(true, null);
        }).toThrow();
    });

    it("Publishes with a valid identifier", () => {
        expect(() => {
            canal.publish({id: 1619}, "bar");
        }).not.toThrow();
    });
});

describe("Topic Tests:", () => {
    it("Throws when attempting to create a topic with a null name", () => {
        expect(() => {
            var testTopic = canal.topic(null);
        }).toThrow();
    });

    it("Throws when attempting to create a topic with an empty name", () => {
        expect(() => {
            var testTopic = canal.topic("");
        }).toThrow();
    });

    it("Expects a created topic to have the proper name", () => {
        var topicName = "CanalRocks";
        var testTopic = canal.topic(topicName);

        expect(testTopic.name).toEqual(topicName)
    });

    it("Expects to throw when given a non-string name", () => {
        expect(() => {
            var testTopic = (<any>canal).topic({foo: 1});
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

describe("PubSub Tests:", () => {
    var value:number,
        testTransmissionValue:string = "Space-Dye Vest";

    beforeEach(()=> {
        value = 0;
        testTransmissionValue = "";
    });

    it("Expects a publication to interact to a subscription.", function (done) {
        var identifier = {id: 16};

        canal.subscribe(identifier, () => {
            value++;
            expect(value).toBe(1);
            done();
        });

        canal.publish(identifier, "foo");
    });

    it("Expects a publication to interact to 3 subscriptions, 2 times.", function (done) {
        var identifier = {id: 16};

        canal.subscribe(identifier, () => {
            value++;
        });

        canal.publish(identifier, "foo"); // value = 1

        canal.subscribe(identifier, () => {
            value++;
        });

        canal.publish(identifier, "foo"); // value = 3

        canal.subscribe(identifier, () => {
            value++;
        });

        canal.publish(identifier, "foo");

        setTimeout(() => {
            expect(value).toBe(6);
            done();
        }, 100);
    });

    it("Expects a publication to not interact to a subscription on a different topic.", function (done) {
        var identifier = {id: 16};
        var testTopic = canal.topic("topic2");

        canal.subscribe(identifier, () => {
            value = 10;
        });

        testTopic.subscribe(identifier, () => {
            value += 100;
        });

        canal.publish(identifier, "foo");

        setTimeout(() => {
            expect(value).toBe(10);
            done();
        }, 100);
    });

    it("Expects a publication to not interact to a subscription on a different topic.", function (done) {
        var identifier = {id: 16},
            receivedValue:string = "";

        canal.subscribe(identifier, (testValue) => {
            receivedValue = testValue;
        });

        canal.publish(identifier, testTransmissionValue);

        setTimeout(() => {
            expect(receivedValue).toBe(testTransmissionValue);
            done();
        }, 100);
    });

    it("Expects a publication to not interact to a subscription that has been unsubscribed.", function (done) {
        var identifier = {id: 16};

        var nodeId = canal.subscribe(identifier, () => {
            value++;
        });

        canal.unsubscribe(nodeId);

        canal.publish(identifier);

        setTimeout(() => {
            expect(value).toBe(0);
            done();
        }, 100);
    });

    it("Expects a publication to not interact to a subscription that has been unsubscribed automatically.", function (done) {
        var identifier = {id: 16};

        canal.subscribe(identifier, () => {
            value++;
        }, true);

        canal.publish(identifier);
        canal.publish(identifier);

        setTimeout(() => {
            expect(value).toBe(1);
            done();
        }, 100);
    });
});