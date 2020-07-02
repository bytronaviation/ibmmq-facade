const queueManagerConnector = require('./src/connectors/QueueManagerConnector');
const queueConnector = require('./src/connectors/QueueConnector');
const Queue = require('./src/queue/Queue');

module.exports = {
  queueManagerConnector,
  queueConnector,
  Queue
}
