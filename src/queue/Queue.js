const mq = require('ibmmq');
const Promise = require('bluebird');

const MQC = mq.MQC;

function getReadMessageOptions() {
  const messageDescriptor = new mq.MQMD();
  const messageOptions = new mq.MQGMO();

  messageOptions.Options = MQC.MQGMO_NO_SYNCPOINT |
    MQC.MQGMO_NO_WAIT |
    MQC.MQGMO_CONVERT |
    MQC.MQGMO_FAIL_IF_QUIESCING;

  return {
    messageDescriptor,
    messageOptions
  };
}

function getWriteMessageOptions() {
  const messageDescriptor = new mq.MQMD();
  const messageOptions = new mq.MQPMO();

  messageOptions.Options = MQC.MQPMO_NO_SYNCPOINT |
    MQC.MQPMO_NEW_MSG_ID |
    MQC.MQPMO_NEW_CORREL_ID;

  return {
    messageDescriptor,
    messageOptions
  };
}

function Queue(queueHandle, bufferSize = 1024) {
  this.handle = queueHandle;
  this.bufferSize = bufferSize;

  // we will assume there are messages on instantiation
  this.messagesPresent = true;
}

Queue.prototype.setBufferSize = function(bufferSize) {
  this.bufferSize = bufferSize;
}

Queue.prototype.peek = async function() {
  let {messageDescriptor, messageOptions} = getReadMessageOptions();
  messageOptions.Options |= MQC.MQGMO_BROWSE_FIRST;
  const buffer = Buffer.alloc(this.bufferSize);

  try {
    console.log('peek first message');
    const messageLength = await Promise.promisify(mq.GetSync)(this.handle, messageDescriptor, messageOptions, buffer);

    return {
      messageLength,
      messageDescriptor
    }
  } catch (error) {
    if (error.mqrc === MQC.MQRC_TRUNCATED_MSG_FAILED || error.mqrc === MQC.MQRC_NO_MSG_AVAILABLE) {
      console.log('no more messages present in queue');
      this.messagesPresent = false;

      // if we are peeking an empty queue then just return
      return;
    }

    throw error;
  } finally {
    // remove the option of browsing a message so that
    // the message can be retrieved and removed from the queue.
    // this option is re-added if this method is called again
    messageOptions.Options &= ~MQC.MQGMO_BROWSE_FIRST;
  }
}

Queue.prototype.dequeue = async function() {
  const {messageDescriptor, messageOptions} = getReadMessageOptions();
  const buffer = Buffer.alloc(this.bufferSize);

  try {
    console.log('Are there messages in the queue?');
    await Promise.promisify(mq.GetSync)(this.handle, messageDescriptor, messageOptions, buffer);
    console.log('There are message(s) present in the queue');

    return buffer;
  } catch (error) {
    if (error.mqrc === MQC.MQRC_NO_MSG_AVAILABLE) {
      console.log('No more messages present in queue');
      this.messagesPresent = false;

      // just return if we are dealing with an empty queue
      return;
    }

    throw error;
  }
}

Queue.prototype.enqueue = async function(message) {
  const {messageDescriptor, messageOptions} = getWriteMessageOptions();

  await mq.PutPromise(this.handle, messageDescriptor, messageOptions, message);
  console.log('message successfully put on queue');
}

Queue.prototype.isMessages = function() {
  return this.messagesPresent;
}

module.exports = Queue;
