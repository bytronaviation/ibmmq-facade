# IBMMQ FACADE
A high abstraction facade to the [ibmmq](https://www.npmjs.com/package/ibmmq) library.

## Installation
```bash
npm install --save ibmmq-facade
```

## Examples

#### Connecting to our queue manager and queue
```javascript
const {queueManagerConnector, queueConnector, Queue} = require('ibmmq-facade');

const config = {
  host: 'localhost',
  port: 1750,
  user: 'user',
  password: 'password',
  queueManagerName: 'qMrg',
  channelName: 'chName',
};

(async function() {
  try {
    // returns the queue manager handle object which must be passed in when connecting a queue
    const qmHandle = await queueManagerConnector.connect(config);

    const queueName = 'MY_QUEUE';
    // returns a queue handle which must be passed to your queue data structure
    // when retrieving or sending messages
    const queueHandle = await queueConnector.connect(qmHandle, queueName);
  } catch (error) {
    return false;
  } finally {
    queueConnector.clean();
    queueManagerConnector.clean();
  }
})

```

#### Getting messages from queue
```javascript
// this buffer can be any integer lower than the queue managers max message length (in bytes)
// if you know the size of data on a queue, it is best to set this manually
// if you are unsure, then set it to queue managers the max message length
const buffer = queueManagerConnector.getConnectionOptions().ClientConn.MaxMsgLength;
const queue = new Queue(queueHandle, buffer);

while (queue.isMessages()) {
  const message = queue.dequeue();

  // do something with the message contents?
  console.log(message);
}
```

#### Putting messages on to queueConnector
```javascript
const queue = new Queue(queueHandle);

const message = "Hello World";
queue.enqueue(message);
```

## Public methods
#### QueueManagerConnector
* QueueManager::isConfigValid(configObject) : bool
* QueueManager::connect(configObject) : object
* QueueManager::getHandle() : object
* QueueManager::clean()

#### queueConnector
* QueueConnector::getQueueOptions() : object
* QueueConnector::connect(queueManagerHandle, queueName) : object
* QueueConnector::getHandle() : object
* QueueConnector::clean()

#### Queue
* Queue::__construct(queueHandle [, buffer])
* Queue::dequeue() : string
* Queue::enqueue(message)
* Queue::isMessages() : bool
