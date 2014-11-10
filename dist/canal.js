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
        function Topic(topic) {
            this.topic = topic;
            this.subscriptionArr = [];
            this.nodeIdCount = 0;
            this.identifierToValidatorDict = {};
        }
        Topic.prototype.makeValidatorKey = function (identifier) {
            if (Object(identifier) !== identifier) {
                throw new TypeError('Identifiers must be valid objects');
            }
            var keyArr = Object.keys(identifier), sortedArr = keyArr.sort(), mappedArr = sortedArr.map(function (key) {
                var ret = {};
                ret[key] = identifier[key];
                return ret;
            });
            return JSON.stringify(mappedArr);
        };
        Topic.prototype.getOrMakeValidator = function (identifier) {
            if (Object(identifier) !== identifier) {
                throw new TypeError('Identifiers must be valid objects');
            }
            var key = this.makeValidatorKey(identifier), currValidator = this.identifierToValidatorDict[key];
            if (!currValidator) {
                currValidator = function (other) {
                    if (Object(other) !== identifier) {
                        throw new TypeError('Identifiers must be valid objects');
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
        Topic.prototype.publish = function (identifier, data) {
        };
        Topic.prototype.subscribe = function (identifier, callback) {
            var newNode = new SubscriptionNode(++this.nodeIdCount, this.getOrMakeValidator(identifier), callback);
            this.subscriptionArr.push(newNode);
            return newNode.id;
        };
        return Topic;
    })();
    canal.Topic = Topic;
    var root = new Topic("root");
    function topic(topic) {
        return new Topic(topic);
    }
    canal.topic = topic;
    function publish(identifier, data) {
        return root.publish(identifier, data);
    }
    canal.publish = publish;
    function subscribe(identifier, callback) {
        return root.subscribe(identifier, callback);
    }
    canal.subscribe = subscribe;
})(canal || (canal = {}));
//# sourceMappingURL=canal.js.map