canal.js
=====

A hybrid pub/sub javascript library.

## The Goal
The goal of canal is to make a simple and accessible pub/sub library that can be easily dropped into any javascript application to allow for easy, efficient, organized, and readable event handling.

## Installing
### Via Bower
```
bower install canal.js
```

### Via Nuget
```
Install-Package canal.js
```

## The Structure
### The Topic
A topic can be explicity set to allow for organization of messages. For example, you may want to run strictly ui related events on a topic like `system-ui`.

You can explicitly define what topic you will be publishing to and subscribing from with `var myTopic = canal.topic("topic-name");` the topic will be created if it does not exist, and returned.

By default, events not specified into a specific topic will be in the `root` topic.

For the rest of the documtation, we will be demonstrating using the root topic.

### The content identifier
You will publish and subscribe to events based on an object that will behave as an identifier; attempting to use a primitive will result in an error being thrown.

For this documentation, we will be using example identifiers of:

```
	var userTweeted = { type: "tweet", userId: 1619 };
	var allTweets = { type: "tweet" };
	var user = { userId: 1619 };
	var userBlogged = { type: "blogged", userId: 1619 };
	var userTweetedMe = { type: "tweet", userId: 1619, myId: 2112 };
```

Creating a subscription is simple:

```
	var logAnyTweet = canal.subscribe(allTweets, console.log);
```

And publishing is equally simple:

```
	canal.publish(userTweeted, "Hey, check out this cool message publishing library!");
```

Subscriptions will receive messages published that are as precise, or more precise, than what they subscribe to. The following tables will demonstrate what subscriptions will receive which publications.

Subscribed To  | Receives Publications From
------------- | -------------
`userTweeted`  | `userTweeted` `userTweetedMe`
`allTweets` | `userTweeted` `allTweets` `userTweetedMe`
`user` | `userTweeted` `user` `userBlogged` `userTweetedMe`
`userBlogged` | `userBlogged`
`userTweetedMe` | `userTweetedMe`

### The subscription id
The creation of a subscription will return an id that can be used to refer to that particular subscription at a later point in time.

This will allow you to see metadata about that subscription or remove that subscription when you no longer wish to listen for it.

## Good practices
Remembering to dispose of subscriptions when you no longer care about prevents memory leakage.

In the above subscription example:

```
	var logAnyTweet = canal.subscribe(allTweets, console.log);
```

We stop the id of that particular subscription in `logAnyTweet`.

In order to unsubscribe, you send that id back to the topic with the unsubscribe call. IE:


```
	var logAnyTweet = canal.subscribe(allTweets, console.log);
	canal.unsubscribe(logAnyTweet);
```

Or, with a topic

```
	var tweetTopic = canal.topic("Tweets");
	var userTweetedMe = { type: "tweet", userId: 1619, myId: 2112 };
	var userTweetedMeSubscription = tweetTopic.subscribe(userTweetedMe, console.log);
	tweetTopic.unsubscribe(userTweetedMeSubscription);
```
