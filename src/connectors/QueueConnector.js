const mq = require('ibmmq');

function QueueConnector(mq) {
  this.mq = mq;
  this.MQC = mq.MQC;
  this.handle = null;
  this.queueOptions = new mq.MQOD();
}

QueueConnector.prototype.getQueueOptions = function() {
  return this.queueOptions;
}

QueueConnector.prototype.connect = async function(queueManagerHandle, queueName) {
  console.log(`Connecting to queue: ${queueName}`);

  this.queueOptions.ObjectName = queueName;
  this.queueOptions.ObjectType = this.MQC.MQOT_Q;

  const openOptions = this.MQC.MQOO_INPUT_AS_Q_DEF | this.MQC.MQOO_OUTPUT;
  this.handle = await this.mq.OpenPromise(queueManagerHandle, this.queueOptions, openOptions);

  console.log('Successfully connected to queue');

  return this.handle;
}

QueueConnector.prototype.getHandle = function() {
  if (!this.handle) {
    console.error('queue handle not set. Make sure you have connected to the queue first');
  }

  return this.handle;
}

QueueConnector.prototype.clean = function() {
  if (!this.handle) {
    return;
  }

  this.mq.Close(this.handle, 0, function(error) {
    if (error) {
      console.error(error);
    } else {
      console.log('Successfully closed queue');
    }
  });
}

module.exports = new QueueConnector(mq);
