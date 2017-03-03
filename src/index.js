const CONNECTED_STATE = 1;

function Client(uri) {
  /**
   * Jobs to execute on receive message packet.
   *
   * @type {Array}
   */
  this.jobs = [];

  /**
   * Callback to execute on connect to server.
   *
   * @type {Function}
   */
  this._onConnect = () => {};

  /**
   * Callback to execute on disconnect from server.
   *
   * @type {Function}
   */
  this._onDisconnect = () => {};

  /**
   * Add callback to execute on connect to server.
   *
   * @param  {Function} callback
   */
  this.onConnect = (callback) => {
    this._onConnect = callback;
  };

  /**
   * Add callback to execute on disconnect from connection.
   *
   * @param  {Function} callback
   */
  this.onDisconnect = (callback) => {
    this._onDisconnect = callback;
  };

  /**
   * Instance of ws.
   *
   * @type {Object}
   */
  this.instance = {};

  /**
   * Reconnecting errors amount.
   *
   * @type {number}
   */
  this.reconnectAmount = 0;

  /**
   * Start reconnecter interval.
   */
  this.reconnect = () => {
    if (this.instance.readyState !== CONNECTED_STATE) {
      this.reconnectAmount += 1;
      this.connect();
    }
  };

  /**
   * Start new websocket server.
   */
  this.connect = () => {
    const instance = new global.WebSocket(uri);

    instance.onopen = () => {
      console.log('open');

      this.reconnectAmount = 0;
      this._onConnect();
    };

    instance.onclose = () => {
      console.log('close');

      if (this.reconnectAmount === 0) {
        this._onDisconnect();
      }

      setTimeout(this.reconnect, 2500);
    };

    instance.onerror = () => {
      console.log('error');
      setTimeout(this.reconnect, 2500);
    };

    instance.onmessage = (message) => {
      try {
        const response = JSON.parse(message.data);
        this.jobs[response[0]](response[1]);
      } catch (error) {
        //
      }
    };

    this.instance = instance;
  };

  /**
   * Emit packet to server.
   *
   * @param  {String} key
   * @param  {Any} data
   */
  this.emit = (key, data) => {
    this.instance.send(JSON.stringify([key, data]));
  };

  /**
   * Save a job for specific packet.
   *
   * @param  {String} key
   * @param  {Function} callback
   */
  this.on = (key, callback) => {
    this.jobs[key] = callback;
  };

  /**
   * Load notifier to manage connection.
   *
   * @param  {Function} notifier
   */
  this.loadNotifier = (notifier) => {
    notifier(this);
  };
}

export default Client;
