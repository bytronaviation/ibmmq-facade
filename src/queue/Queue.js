const mq = require('ibmmq');
const Promise = require('bluebird');
const StringDecoder = require('string_decoder').StringDecoder;

const MQC = mq.MQC;
const decoder = new StringDecoder('utf8');

function getHeaderLength(format, buffer) {
  switch (format) {
    case MQC.MQFMT_RF_HEADER_2:
      return mq.MQRFH2.getHeader(buffer).StrucLength;
    case MQC.MQFMT_DEAD_LETTER_HEADER:
      return mq.MQDLH.getHeader(buffer).StrucLength;
    default:
      return 0;
  }
}

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

Queue.prototype.dequeue = async function() {
  const {messageDescriptor, messageOptions} = getReadMessageOptions();
  const buffer = Buffer.alloc(this.bufferSize);

  try {
    console.log('Are there messages in the queue?');
    const messageLength = await Promise.promisify(mq.GetSync)(this.handle, messageDescriptor, messageOptions, buffer);
    console.log('There are message(s) present in the queue');

    const format = messageDescriptor.Format;
    const header = getHeaderLength(format);

    return decoder.write(buffer.slice(header.StrucLength), messageLength - header.StrucLength)
  } catch (error) {
    if (error.mqrc === MQC.MQRC_NO_MSG_AVAILABLE) {
      console.log('No more messages present in queue');
      this.messagesPresent = false;
    }

    throw Error(error);
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
