declare module canal {
    class Topic {
        name: string;
        private nodeIdCount;
        private identifierToValidatorDict;
        private identifierToSubscriptionNodesDict;
        private nodeIdToIdentifierKeyDict;
        private getOrMakeValidator(identifier);
        publish(identifier: Object, data?: any, then?: Function): void;
        subscribe(identifier: Object, callback: Function): number;
        unsubscribe(nodeId: number): void;
        private reset();
        delete(): void;
        constructor(name: string);
    }
    function makeValidatorKey(identifier: Object): string;
    function topic(topic: string): Topic;
    function publish(identifier: Object, data?: any, then?: Function): void;
    function subscribe(identifier: Object, callback: Function): number;
    function unsubscribe(nodeId: number): void;
    function init(): void;
}
