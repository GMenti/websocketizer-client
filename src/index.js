const Packets = require('packets');
const Socket = global.WebSocket ? global.WebSocket : require('websocket').w3cwebsocket;

/**
 * Connected state.
 *
 * @type {number}
 */
const CONNECTED_STATE = 1;

/**
 * Time to reconnect in ms.
 *
 * @type {number}
 */
const RECONNECT_TIME = 2500;

/**
 * Default identifiers of packets.
 *
 * @type {object}
 */
const IDENTIFIERS = {
  PACKETS: 'packets',
};

/**
 * Parse message data and return.
 *
 * @param {object} message
 * @return {Array}
 */
const parseData = (message) => {
  try {
    return JSON.parse(message.data);
  } catch (error) {
    return [];
  }
};

class Client {
  /**
   * Contructor of client instance.
   *
   * @param {string} uri
   * @param {Array} jobs
   */
  constructor(uri) {
    this.onConnectCallback = () => {};
    this.onDisconnectCallback = () => {};
    this.clientPackets = {};
    this.serverPackets = {};
    this.uri = uri;
    this.jobsToTransform = {};
    this.jobs = {};
    this.instance = null;
    this.connected = false;
  }

  /**
   * Add callback to execute on connect to server.
   *
   * @param {function} callback
   */
  onConnect(callback) {
    if (typeof callback !== 'function') {
      throw new Error("Job to process 'onConnect' must be a function");
    }

    this.onConnectCallback = callback;
  }

  /**
   * Add callback to execute on disconnect from connection.
   *
   * @param {function} callback
   */
  onDisconnect(callback) {
    if (typeof callback !== 'function') {
      throw new Error("Job to process 'onDisconnect' must be a function");
    }

    this.onDisconnectCallback = callback;
  }

  /**
   * Add job to transform and process on receive packet.
   *
   * @param {string} key
   * @param {function} callback
   */
  on(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error(`Job to process '${key}' must be a function`);
    }

    this.jobsToTransform[key] = callback;
  }

  /**
   * Emit packet to server.
   *
   * @param {string} key
   * @param {*} data
   */
  emit(key, data) {
    const packetIdentifier = this.clientPackets.get(key);

    try {
      this.instance.send(JSON.stringify([packetIdentifier, data]));
    } catch (error) {
      //
    }
  }

  /**
   * Connect to the server uri.
   */
  connect() {
    const instance = new Socket(this.uri);

    instance.open = () => {
      //
    };

    instance.onclose = () => {
      if (this.connected) {
        this.connected = false;
        this.onDisconnectCallback();
      }

      setTimeout(() => {
        if (this.instance.readyState !== CONNECTED_STATE) {
          this.connect();
        }
      }, RECONNECT_TIME);
    };

    instance.onerror = () => {
      //
    };

    instance.onmessage = (message) => {
      const [packetIdentifier, data] = parseData(message);

      if (packetIdentifier === IDENTIFIERS.PACKETS) {
        this.clientPackets = new Packets(data.clientPackets);
        this.serverPackets = new Packets(data.serverPackets);

        const jobs = {};

        Object.keys(this.jobsToTransform).forEach((key) => {
          const packetId = this.serverPackets.get(key);
          jobs[packetId] = this.jobsToTransform[key];
        });

        this.jobs = jobs;
        this.connected = true;
        this.onConnectCallback();
      } else if (this.jobs[packetIdentifier]) {
        this.jobs[packetIdentifier](data);
      }
    };

    this.instance = instance;
  }
}

module.exports = Client;
