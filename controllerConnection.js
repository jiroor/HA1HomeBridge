//
// HA1Controller connection
//

'use strict';

const net = require('net');

class controllerConnection {

  constructor(config, receiveDataFunc) {
    this.ConnectState = 0;
    this.Client = null;
    this.ServerPort = config.serverPort;
    this.ReceiveDataFunc = receiveDataFunc;
    this.IntervalId = null;
    this._IntervalConnect();
  }
  
  _IntervalConnect() {
    if(this.ConnectState == 0) {
      this.Client = net.connect(this.ServerPort);

      this.Client.on('connect', () => {
        this.ConnectState = 1;
        console.log('connect ha1server');
        this.Client.setEncoding('utf8');
        this.Client.write('format json\r\n');
      });

      this.Client.on('data', (data) => {
        if(this.ConnectState == 1) {
          const p = data.search("format json : OK");
          if(p >= 0) {
            this.ConnectState = 2;
            data = data.substr(p + 17);
          } else {
            return;
          }
        }
        if(this.ConnectState == 2) {
          const strs = data.split('\0');
          for(let str of strs) {
            if(str.length) {
              let msg;
              try {
                msg = JSON.parse(str);
              } catch(e) {
                msg = null;
                console.log(e);
                console.log(str);
              }
              if(msg != null) this.ReceiveDataFunc(msg);
            }
          }
        }
      });

      this.Client.on('end', () => {
        console.log('disconnect ha1server');
        this.ConnectState = 0;
      });

      this.Client.on('error', (e) => {
        this.ConnectState = 0;
        this.Client.destroy();
        console.log('----');
        console.log('[ error ]');
        console.log(Date());
        console.log(e.stack);
        console.log('----');
      });
    }
    if(this.IntervalId == null) {
      this.IntervalId = setInterval(() => { this._IntervalConnect(); }, 5 * 1000);
    }
  }
  
  SendData(msg) {
    this.Client.write(JSON.stringify(msg));
  }
}

module.exports = controllerConnection;
