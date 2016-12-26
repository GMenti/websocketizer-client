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
   * Reconnecter interval
   *
   * @type {Timer}
   */
  this.reconnecter = null;

  /**
   * Start reconnecter interval.
   */
  this.startReconnecter = () => {
    if (this.instance.readyState !== CONNECTED_STATE && !this.reconnecter) {
      this.reconnecter = setInterval(() => {
        this.connect();
      }, 2500);
    }
  };

  /**
   * Stop reconnecter interval.
   */
  this.stopReconnecter = () => {
    if (this.reconnecter) {
      clearInterval(this.reconnecter);
      this.reconnecter = null;
    }
  };

  /**
   * Start new websocket server.
   */
  this.connect = () => {
    const instance = new global.WebSocket(uri);

    instance.onopen = () => {
      this.stopReconnecter();
      this._onConnect();
    };

    instance.onclose = () => {
      this.startReconnecter();
      this._onDisconnect();
    };

    instance.onerror = () => {
      this.startReconnecter();
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
