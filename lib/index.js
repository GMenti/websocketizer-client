var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Packets = require('packets');
var Socket = global.WebSocket ? global.WebSocket : require('websocket').w3cwebsocket;

/**
 * Connected state.
 *
 * @type {number}
 */
var CONNECTED_STATE = 1;

/**
 * Time to reconnect in ms.
 *
 * @type {number}
 */
var RECONNECT_TIME = 2500;

/**
 * Default identifiers of packets.
 *
 * @type {object}
 */
var IDENTIFIERS = {
  PACKETS: 'packets'
};

/**
 * Parse message data and return.
 *
 * @param {object} message
 * @return {Array}
 */
var parseData = function parseData(message) {
  try {
    return JSON.parse(message.data);
  } catch (error) {
    return [];
  }
};

var Client = function () {
  /**
   * Contructor of client instance.
   *
   * @param {string} uri
   * @param {Array} jobs
   */
  function Client(uri) {
    _classCallCheck(this, Client);

    this.onConnectCallback = function () {};
    this.onDisconnectCallback = function () {};
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


  _createClass(Client, [{
    key: 'onConnect',
    value: function () {
      function onConnect(callback) {
        if (typeof callback !== 'function') {
          throw new Error("Job to process 'onConnect' must be a function");
        }

        this.onConnectCallback = callback;
      }

      return onConnect;
    }()

    /**
     * Add callback to execute on disconnect from connection.
     *
     * @param {function} callback
     */

  }, {
    key: 'onDisconnect',
    value: function () {
      function onDisconnect(callback) {
        if (typeof callback !== 'function') {
          throw new Error("Job to process 'onDisconnect' must be a function");
        }

        this.onDisconnectCallback = callback;
      }

      return onDisconnect;
    }()

    /**
     * Add job to transform and process on receive packet.
     *
     * @param {string} key
     * @param {function} callback
     */

  }, {
    key: 'on',
    value: function () {
      function on(key, callback) {
        if (typeof callback !== 'function') {
          throw new Error('Job to process \'' + String(key) + '\' must be a function');
        }

        this.jobsToTransform[key] = callback;
      }

      return on;
    }()

    /**
     * Emit packet to server.
     *
     * @param {string} key
     * @param {*} data
     */

  }, {
    key: 'emit',
    value: function () {
      function emit(key, data) {
        var packetIdentifier = this.clientPackets.get(key);

        try {
          this.instance.send(JSON.stringify([packetIdentifier, data]));
        } catch (error) {
          //
        }
      }

      return emit;
    }()

    /**
     * Connect to the server uri.
     */

  }, {
    key: 'connect',
    value: function () {
      function connect() {
        var _this = this;

        var instance = new Socket(this.uri);

        instance.open = function () {
          //
        };

        instance.onclose = function () {
          if (_this.connected) {
            _this.connected = false;
            _this.onDisconnectCallback();
          }

          setTimeout(function () {
            if (_this.instance.readyState !== CONNECTED_STATE) {
              _this.connect();
            }
          }, RECONNECT_TIME);
        };

        instance.onerror = function () {
          //
        };

        instance.onmessage = function (message) {
          var _parseData = parseData(message),
              _parseData2 = _slicedToArray(_parseData, 2),
              packetIdentifier = _parseData2[0],
              data = _parseData2[1];

          if (packetIdentifier === IDENTIFIERS.PACKETS) {
            _this.clientPackets = new Packets(data.clientPackets);
            _this.serverPackets = new Packets(data.serverPackets);

            var jobs = {};

            Object.keys(_this.jobsToTransform).forEach(function (key) {
              var packetId = _this.serverPackets.get(key);
              jobs[packetId] = _this.jobsToTransform[key];
            });

            _this.jobs = jobs;
            _this.connected = true;
            _this.onConnectCallback();
          } else if (_this.jobs[packetIdentifier]) {
            _this.jobs[packetIdentifier](data);
          }
        };

        this.instance = instance;
      }

      return connect;
    }()
  }]);

  return Client;
}();

module.exports = Client;