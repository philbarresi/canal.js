// A polyfill is added so that we can get use Object.keys in order to store
// only one equality identifier function for many subscriptions that are identical
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
// Modified to return string[]
if (!Object.keys) {
    Object.keys = (function () {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty, hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'), dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ], dontEnumsLength = dontEnums.length;
        return function (obj) {
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }
            var result = [], prop, i;
            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }
            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}
var canal;
(function (canal) {
    var SubscriptionNode = (function () {
        function SubscriptionNode(id, validator, callback) {
            this.id = id;
            this.validator = validator;
            this.callback = callback;
        }
        return SubscriptionNode;
    })();
    var Topic = (function () {
        function Topic(name) {
            this.name = name;
            this.nodeIdCount = 0;
            this.identifierToValidatorDict = {};
            this.identifierToSubscriptionNodesDict = {};
        }
        Topic.prototype.getOrMakeValidator = function (identifier) {
            if (Object(identifier) !== identifier) {
                throw new TypeError('Cannot get or make validator without an object');
            }
            var key = canal.makeValidatorKey(identifier), currValidator = this.identifierToValidatorDict[key];
            if (!currValidator) {
                currValidator = function (other) {
                    if (Object(other) !== other) {
                        throw new TypeError('You must pass a valid identifier to compare against a subscription.');
                    }
                    for (var key in identifier) {
                        if (!identifier.hasOwnProperty(key))
                            continue;
                        // have to check if other has property
                        // a simple equality check on other[key] would
                        // have foo.a === bar.a when
                        // foo = {a: undefined} and bar = {b: 'someVal'}
                        if (!other.hasOwnProperty(key))
                            return false;
                        if (other[key] !== identifier[key])
                            return false;
                    }
                    return true;
                };
                this.identifierToValidatorDict[key] = currValidator;
            }
            return currValidator;
        };
        Topic.prototype.publish = function (identifier, data, then) {
            if (Object(identifier) !== identifier) {
                throw new TypeError('You must publish with an object');
            }
            for (var key in this.identifierToValidatorDict) {
                if (!this.identifierToValidatorDict.hasOwnProperty(key))
                    continue;
                if (this.identifierToValidatorDict[key](identifier)) {
                    // this identifier passes the validator test for a specific identifier
                    var currSubscriptionList = this.identifierToSubscriptionNodesDict[key];
                    if (currSubscriptionList && currSubscriptionList.length > 0) {
                        for (var i = 0; i < currSubscriptionList.length; i++) {
                            var curr = currSubscriptionList[i];
                            var boundCurr = curr.callback.bind(curr);
                            boundCurr(data);
                        }
                    }
                }
            }
            if (then && typeof then === "function") {
                then();
            }
        };
        Topic.prototype.subscribe = function (identifier, callback) {
            if (Object(identifier) !== identifier) {
                throw new TypeError('You must subscribe with an object');
            }
            var key = canal.makeValidatorKey(identifier), newNode = new SubscriptionNode(++this.nodeIdCount, this.getOrMakeValidator(identifier), callback);
            if (!this.identifierToSubscriptionNodesDict[key]) {
                this.identifierToSubscriptionNodesDict[key] = [];
            }
            this.identifierToSubscriptionNodesDict[key].push(newNode);
            return newNode.id;
        };
        Topic.prototype.reset = function () {
            for (var key in this.identifierToValidatorDict) {
                delete this.identifierToValidatorDict[key];
            }
            for (var key in this.identifierToSubscriptionNodesDict) {
                this.identifierToSubscriptionNodesDict[key].length = 0;
                delete this.identifierToSubscriptionNodesDict[key];
            }
        };
        Topic.prototype.delete = function () {
            this.reset();
            delete this.identifierToValidatorDict;
            delete this.identifierToSubscriptionNodesDict;
        };
        return Topic;
    })();
    canal.Topic = Topic;
    var topicDict = {};
    var root = new Topic("root");
    topicDict["root"] = root;
    function makeValidatorKey(identifier) {
        if (Object(identifier) !== identifier) {
            throw new TypeError('Cannot make a validator key without an object');
        }
        var keyArr = Object.keys(identifier), sortedArr = keyArr.sort(), mappedArr = sortedArr.map(function (key) {
            var ret = {};
            ret[key] = identifier[key];
            return ret;
        });
        return JSON.stringify(mappedArr);
    }
    canal.makeValidatorKey = makeValidatorKey;
    function topic(topic) {
        if (typeof topic !== "string")
            throw new TypeError("You must provide a string to create or get a topic");
        if (topic.length === 0)
            throw new Error("Your topic name must not be null or empty.");
        if (!topicDict[topic])
            topicDict[topic] = new Topic(topic);
        return topicDict[topic];
    }
    canal.topic = topic;
    function publish(identifier, data, then) {
        return root.publish(identifier, data, then);
    }
    canal.publish = publish;
    function subscribe(identifier, callback) {
        return root.subscribe(identifier, callback);
    }
    canal.subscribe = subscribe;
    function init() {
        for (var topic in topicDict) {
            if (!topicDict.hasOwnProperty(topic))
                continue;
            topicDict[topic].delete();
            delete topicDict[topic];
        }
        topicDict = {};
        root = new Topic("root");
        topicDict["root"] = root;
    }
    canal.init = init;
    init();
})(canal || (canal = {}));
//# sourceMappingURL=canal.js.map