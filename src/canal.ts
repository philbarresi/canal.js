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
        constructor(public id:number, public validator:Function, public callback:Function) {
        }
    }

    export class Topic {
        private subscriptionArr:SubscriptionNode[] = [];
        private nodeIdCount:number = 0;
        private identifierToValidatorDict:Dict<Function> = {};

        private makeValidatorKey(identifier:Object):string {
            if (Object(identifier) !== identifier) {
                throw new TypeError('Identifiers must be valid objects');
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

        private getOrMakeValidator(identifier:Object):Function {
            if (Object(identifier) !== identifier) {
                throw new TypeError('Identifiers must be valid objects');
            }

            var key = this.makeValidatorKey(identifier),
                currValidator = this.identifierToValidatorDict[key];

            if (!currValidator) {
                currValidator = (other:Object) => {
                    if (Object(other) !== identifier) {
                        throw new TypeError('Identifiers must be valid objects');
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

        publish(identifier:Object, data?:any) {

        }

        subscribe(identifier:Object, callback:Function):number {
            var newNode = new SubscriptionNode(++this.nodeIdCount, this.getOrMakeValidator(identifier), callback);

            this.subscriptionArr.push(newNode);

            return newNode.id;
        }

        constructor(public topic:string) {
        }
    }

    var root = new Topic("root");

    export function topic(topic:string):Topic {
        return new Topic(topic);
    }

    export function publish(identifier:Object, data?:any) {
        return root.publish(identifier, data);
    }

    export function subscribe(identifier:Object, callback:Function):number {
        return root.subscribe(identifier, callback);
    }
}
