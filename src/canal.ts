// A polyfill is added so that we can get use Object.keys in order to store
// only one equality identifier function for many subscriptions that are identical
// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
// Modified to return string[]

if (!Object.keys) {
    Object.keys = (function () {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;

        return function (obj):Array<string> {
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

module canal {
    interface Dict<T> {
        [key: string]: T;
    }

    class SubscriptionNode {
        constructor(public id:number, public validator:Function, public callback:(data:any, subscriptionId?:number) => any, public singleUse:boolean = false) {
        }
    }

    export class Topic {
        private nodeIdCount:number = 0;
        private identifierToValidatorDict:Dict<Function> = {};
        private identifierToSubscriptionNodesDict:Dict<SubscriptionNode[]> = {};
        private nodeIdToIdentifierKeyDict:Dict<string> = {};

        private getOrMakeValidator(identifier:Object):Function {
            if (Object(identifier) !== identifier) {
                throw new TypeError('Cannot get or make validator without an object');
            }

            var key = canal.makeValidatorKey(identifier),
                currValidator = this.identifierToValidatorDict[key];

            if (!currValidator) {
                currValidator = (other:Object) => {
                    if (Object(other) !== other) {
                        throw new TypeError('You must pass a valid identifier to compare against a subscription.');
                    }

                    for (var key in identifier) {
                        if (!identifier.hasOwnProperty(key)) continue;

                        // have to check if other has property
                        // a simple equality check on other[key] would
                        // have foo.a === bar.a when
                        // foo = {a: undefined} and bar = {b: 'someVal'}
                        if (!other.hasOwnProperty(key)) return false;
                        if (other[key] !== identifier[key]) return false;
                    }

                    return true;
                };

                this.identifierToValidatorDict[key] = currValidator;
            }

            return currValidator;
        }

        publish(identifier:Object, data?:any, then?:Function):void {
            if (Object(identifier) !== identifier) {
                throw new TypeError('You must publish with an object');
            }

            var self = this;

            // we check each key in the validator dictionary;
            // if we have a successful match, we then go back
            // and head to the identifier -> subscription dictionary
            // and publish to each match
            for (var key in this.identifierToValidatorDict) {
                if (!this.identifierToValidatorDict.hasOwnProperty(key)) continue;

                if (this.identifierToValidatorDict[key](identifier)) {
                    // this identifier passes the validator test for a specific identifier
                    var currSubscriptionList = this.identifierToSubscriptionNodesDict[key];

                    if (currSubscriptionList && currSubscriptionList.length > 0) {
                        for (var i = 0; i < currSubscriptionList.length; i++) {
                            var curr = currSubscriptionList[i];
                            if (curr.callback) {
                                curr.callback(data, curr.id);

                                if (curr.singleUse) {
                                    self.unsubscribe(curr.id);
                                }
                            }
                        }
                    }
                }
            }

            if (then && typeof then === "function") {
                then();
            }
        }

        subscribe(identifier:Object, callback:(data:any, subscriptionId?:number) => any, singleUse:boolean = false):number {
            if (Object(identifier) !== identifier) {
                throw new TypeError('You must subscribe with an object');
            }

            var key = canal.makeValidatorKey(identifier),
                newNode = new SubscriptionNode(++this.nodeIdCount, this.getOrMakeValidator(identifier), callback, singleUse);

            this.nodeIdToIdentifierKeyDict[newNode.id] = key;

            if (!this.identifierToSubscriptionNodesDict[key]) {
                this.identifierToSubscriptionNodesDict[key] = [];
            }

            this.identifierToSubscriptionNodesDict[key].push(newNode);

            return newNode.id;
        }

        unsubscribe(nodeId:number):void {
            if (!this.nodeIdToIdentifierKeyDict[nodeId]) throw new Error("Node id could not be found in this topic.");

            var key = this.nodeIdToIdentifierKeyDict[nodeId];
            var nodeList = this.identifierToSubscriptionNodesDict[key];

            for (var i = 0, found = false, currNode; i < nodeList.length && !found; i++) {
                currNode = nodeList[i];

                if (currNode.id === nodeId) {
                    delete currNode;
                    nodeList.splice(i, 1);
                }
            }

            delete this.nodeIdToIdentifierKeyDict[nodeId];
        }

        private reset():void {
            for (var key in this.identifierToValidatorDict) {
                delete this.identifierToValidatorDict[key];
            }

            for (var key in this.identifierToSubscriptionNodesDict) {
                this.identifierToSubscriptionNodesDict[key].length = 0;
                delete this.identifierToSubscriptionNodesDict[key];
            }

            for (var key in this.nodeIdToIdentifierKeyDict) {
                delete this.nodeIdToIdentifierKeyDict[key];
            }
        }

        delete():void {
            this.reset();
            delete this.identifierToValidatorDict;
            delete this.identifierToSubscriptionNodesDict;
            delete this.nodeIdToIdentifierKeyDict;
        }

        constructor(public name:string) {
        }
    }

    var topicDict:Dict<Topic> = {};
    var root = new Topic("root");
    topicDict["root"] = root;

    export function makeValidatorKey(identifier:Object):string {
        if (Object(identifier) !== identifier) {
            throw new TypeError('Cannot make a validator key without an object');
        }

        var keyArr:string[] = Object.keys(identifier),
            sortedArr = keyArr.sort(),
            mappedArr = sortedArr.map((key) => {
                var ret = {};
                ret[key] = identifier[key];
                return ret;
            });

        return JSON.stringify(mappedArr);
    }

    export function topic(topic:string):Topic {
        if (typeof topic !== "string") throw new TypeError("You must provide a string to create or get a topic");
        if (topic.length === 0) throw new Error("Your topic name must not be null or empty.");

        if (!topicDict[topic]) topicDict[topic] = new Topic(topic);

        return topicDict[topic];
    }

    export function publish(identifier:Object, data?:any, then?:Function):void {
        return root.publish(identifier, data, then);
    }

    export function subscribe(identifier:Object, callback:(data:any, subscriptionId?:number) => any, singleUse:boolean = false):number {
        return root.subscribe(identifier, callback, singleUse);
    }

    export function unsubscribe(nodeId:number):void {
        return root.unsubscribe(nodeId);
    }

    export function init() {
        for (var topic in topicDict) {
            if (!topicDict.hasOwnProperty(topic)) continue;

            topicDict[topic].delete();
            delete topicDict[topic];
        }

        topicDict = {};
        root = new Topic("root");
        topicDict["root"] = root;
    }

    init();
}
