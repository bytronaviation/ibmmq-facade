const queueManagerConnector = require('../../src/connectors/QueueManagerConnector');

describe('QueueManagerConnector::isConfigValid', function() {
  const requiredProperties = ['user', 'password', 'host', 'port', 'channelName', 'queueManagerName'];
  const validConfig = requiredProperties.reduce((acc, prop) => {
    acc[prop] = true;

    return acc;
  }, {});

  test('returns false if no config passed', function() {
    expect(queueManagerConnector.isConfigValid()).toBe(false);
  })

  test('returns false if object with missing required properties passed', function() {
    expect(queueManagerConnector.isConfigValid({})).toBe(false);
  });

  test('returns false if only some valid properties present', function() {
    const partialProps = Object.entries(requiredProperties).slice(0, 2).map(entry => entry[1]);
    expect(queueManagerConnector.isConfigValid(partialProps)).toBe(false);
  });

  test('returns false if invalid data types passed as config', function() {
    const args = [null, undefined, NaN, false, true, 'string', [], {}, [1, 2, 3], 10, 10.545];
    args.forEach(arg => expect(queueManagerConnector.isConfigValid(arg)).toBe(false));
  });

  test('returns true if config has all required properties', function() {
    expect(queueManagerConnector.isConfigValid(validConfig)).toBe(true);
  });
});
