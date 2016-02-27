//
// ha1platform.js
//

'use strict';

const init = require("hap-nodejs").init;
const uuid = require("hap-nodejs").uuid;
const Bridge = require("hap-nodejs").Bridge;

const ha1accessory = require('./ha1accessory');
const controllerConnection = require('./controllerConnection');
const controllerDummy = require('./controllerDummy');

let Self = null;

class HA1Platform {

  constructor(config) {
    init('persist/');
    Self = this;
    this._Config = config;
    console.log("%s initialize", this._Config.platform.name);
    this._Bridge = null;
    this._StatusChangeEvents = [];
    this._Status = [];
    this._Published = false;

    if(this._Config.platform.demoMode) {
      this._Controller = new controllerDummy(this._Config.platform, (msg) => { this.ReceiveMessage(msg); });
    } else {
      this._Controller = new controllerConnection(this._Config.platform, (msg) => { this.ReceiveMessage(msg); });
    }
    this._Bridge = new Bridge(this._Config.bridge.name, uuid.generate(this._Config.bridge.name));
    this._API = {
      SendCommand: this.SendCommand,
      GetStatus: this.GetStatus,
      GetClientUi: this.GetClientUi,
      AddStatusChangeEvent: this.AddStatusChangeEvent,
    }; 
  }

  SendCommand(cmd) {
    console.log('command : %s', cmd);
    Self._Controller.SendData({type:"command", command:cmd});
  }

  GetStatus(stat) {
    return Self._Status[stat];
  }
  
  GetClientUi(table) {
    return Self._ClientUi[table];
  }

  ReceiveMessage(msg) {
    switch(msg.type) {
      case 'interval':
      case 'change':
        this._StatusNotify(msg);
        break;
      case 'client_ui':
        this._ClientUiNotify(msg);
        break;
      default:
    }
  }

  _StatusNotify(msg) {
    console.log(msg.type);
    for(let d of msg.data) {
      this._Status[d.status] = d.value;
      if((msg.type == 'change') ||
         (d.type == 'temp') ||
         (d.type == 'humidity') ||
         (d.type == 'rain')) {
        if(this._StatusChangeEvents[d.status] != undefined) {
          this._StatusChangeEvents[d.status].forEach((event) => {
            event.func(event.service, d.value);
          });
        }
      }
    }
  }
  
  AddStatusChangeEvent(status, service, func) {
    if(Self._StatusChangeEvents[status] == undefined) Self._StatusChangeEvents[status] = [];
    Self._StatusChangeEvents[status].push({service:service, func:func});
  }

  _ClientUiNotify(msg) {
    this._ClientUi = msg.data;
    this._Bridge.bridgedAccessories = [];
    for(let d of msg.data.ItemList) {
      if(['onOff', 'lock', 'window', 'windowCovering', 'aircon', 'tv'].indexOf(d.type) >= 0) {
        if(d.siriName != undefined) {
          for(let n of d.siriName) {
            this._AddAccessory(d, n);
          }
        }
      }
      if(d.type == 'tv') {
        if(d.table != undefined) {
          for(let ch of this._ClientUi[d.table]) {
            if(ch.siriName != undefined) {
              for(let n of ch.siriName) {
                ch.type = 'tv';
                ch.buttons = [{command:d.commandPrefix + ch.commandSuffix}];
                this._AddAccessory(ch, n);
              }
            }
          }
        }
      }
      if(d.status != undefined) {
        for(let s of d.status) {
          if(['temp', 'humidity', 'battery'].indexOf(s.type) >= 0) {
            if(s.siriName != undefined) {
              for(let n of s.siriName) {
                this._AddAccessory(s, n);
              }
            }
          }
        }
      }
    }
    if(!this._Published) {
      this._PrintPIN(this._Config.bridge.pin);
      this._Bridge.publish({
        username: this._Config.bridge.username || "CC:22:3D:E3:CE:30",
        port: this._Config.bridge.port || 51826,
        pincode: this._Config.bridge.pin || "031-45-154",
        category: ha1accessory.Categories.BRIDGE
        }, false);
      this._Published = true;
    }
  }
  
  _AddAccessory(itemConfig, name) {

    const accessory = new ha1accessory(name, itemConfig, this._Config, this._API);
    try {
      this._Bridge.addBridgedAccessory(accessory);
    } catch(e) {
      console.log(e);
    }
  }

  _PrintPIN(pin) {
    console.log("Scan this code with your HomeKit App on your iOS device to pair with Homebridge:");
    console.log("\x1b[30;47m%s\x1b[0m", "                       ");
    console.log("\x1b[30;47m%s\x1b[0m", "    ┌────────────┐     ");
    console.log("\x1b[30;47m%s\x1b[0m", "    │ " + pin + " │     ");
    console.log("\x1b[30;47m%s\x1b[0m", "    └────────────┘     ");
    console.log("\x1b[30;47m%s\x1b[0m", "                       ");
  }
}

module.exports = HA1Platform;
