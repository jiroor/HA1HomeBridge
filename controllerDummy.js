//
// HA1Controller connection
//

'use strict';

const fs = require('fs');

class controllerConnection {

  constructor(config, receiveDataFunc) {
    this.ReceiveDataFunc = receiveDataFunc;
    const clientUi = JSON.parse(fs.readFileSync('./client.ui'));
    
    setTimeout(() => {
      this.ReceiveDataFunc({type: 'client_ui', data: clientUi});
      this.ReceiveDataFunc({type: 'interval', data: clientUi.Status});
    }, 1000);
  }
    
  SendData(msg) {
    console.log('----');
    console.log(msg);
    console.log('----');
  }
}

module.exports = controllerConnection;
