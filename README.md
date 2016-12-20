# websocketizer-client

> Simple websocket client implementation to use with websocketizer-server

## Getting start

```js
import Client from 'websocketizer-client';

const client = new Client('ws://localhost:7001');

client.onConnect(() => {
  client.emit('say', 'Hello world');
});

client.onDisconnect(() => {
  //
});

client.connect();
```

## Build Setup

``` bash
# install dependencies
npm install

# build for production with minification
npm run build

# start compiled version.
npm run start

# run lint in code
npm run lint
```
