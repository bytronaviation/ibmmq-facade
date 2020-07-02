const mq = require('ibmmq');

function QueueManagerConnector(mq) {
  this.mq = mq;
  this.MQC = mq.MQC;
  this.handle = null;
  this.connectionOptions = new mq.MQCNO();
}

QueueManagerConnector.prototype.getConnectionOptions = function() {
  return this.connectionOptions;
}

QueueManagerConnector.prototype.isConfigValid = function(config) {
  if (!config || typeof config !== 'object') {
    return false;
  }

  let isValid = true;

  const requiredProperties = ['user', 'password', 'host', 'port', 'channelName', 'queueManagerName'];
  requiredProperties.forEach((prop) => {
    if (!config[prop]) {
      console.warn(`${prop} missing from config`);
      isValid = false;
    }
  })

  return isValid;
}

QueueManagerConnector.prototype.connect = async function(config) {
  if (!this.isConfigValid(config)) {
    throw new Error('Invalid config');
  }

  this.connectionOptions.Options |= this.MQC.MQCNO_CLIENT_BINDING;
  
  const securityOptions = new this.mq.MQCSP();
  securityOptions.UserId = config.user;
  securityOptions.Password = config.password;
  this.connectionOptions.SecurityParms = securityOptions;

  const channelOptions = new this.mq.MQCD();
  channelOptions.ConnectionName = `${config.host}(${config.port})`;
  channelOptions.ChannelName = config.channelName;
  this.connectionOptions.ClientConn = channelOptions;

  this.handle = await this.mq.ConnxPromise(config.queueManagerName, this.connectionOptions);

  console.log('Successfully connected to queue manager');

  return this.handle;
}

QueueManagerConnector.prototype.getHandle = function() {
  if (!this.handle) {
    console.error('queue manager handle not set. Make sure you have connected to the queue manager first');
  }

  return this.handle;
}

QueueManagerConnector.prototype.clean = function() {
  if (!this.handle) {
    return;
  }

  this.mq.Disc(this.handle, function(error) {
    if (error) {
      console.error(error);
    } else {
      console.log('Successfully disconnected from queue manager');
    }
  })
}

module.exports = new QueueManagerConnector(mq);
