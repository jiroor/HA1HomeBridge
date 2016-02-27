//
// ha1accessory.js
//

'use strict';

const uuid = require("hap-nodejs").uuid;
const Accessory = require("hap-nodejs").Accessory;
const Service = require("hap-nodejs").Service;
const Characteristic = require("hap-nodejs").Characteristic;

let Self = null;

class HA1Accessory extends Accessory {

  constructor(name, item, config, api) {

    console.log('Initializing platform accessory %s...', name);

    super(name, uuid.generate(config.platform.name + ':' + name));

    Self = this;
    this._Name = name;
    this._Item = item;
    this._SendCommand = api.SendCommand;
    this._GetStatus = api.GetStatus;
    this._GetClientUi = api.GetClientUi;
    this._AddStatusChangeEvent = api.AddStatusChangeEvent;

    this.on('identify', (paired, callback) => {
      console.log('%s : Identify requested!', this._Name);
      callback();
    });
    
    this.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Manufacturer, config.platform.manufacturer)
      .setCharacteristic(Characteristic.Model, config.platform.model)
      .setCharacteristic(Characteristic.SerialNumber, config.platform.serial);
    
    let service = null;
    switch(this._Item.type) {
// control
      case 'onOff':
      case 'tv':
        service = this._ServiceSwitch();
        break;
      case 'lock':
        service = this._ServiceLockMechanism();
        break;
      case 'window':
      case 'windowCovering':
        service = this._ServiceWindow();
        break;
      case 'aircon':
        service = this._ServiceThermostat();
        break;
// sensor
      case 'battery':
        service = this._ServiceBatteryService();
        break;
      case 'temp':
        service = this._ServiceTemperatureSensor();
        break;
      case 'humidity':
        service = this._ServiceHumiditySensor();
        break;
      default:
        console.log('error : %s', this._Item.type);
        return;
    }
    this.addService(service);
  }

  _SearchStatus(type) {
    if(this._Item.status != undefined) {
      for(let s of this._Item.status) {
        if(s.type == type) return this._GetStatus(s.sensor);
      }
    }
    return;
  }

  _AddStatusChange(service, func, type) {
    if(this._Item.status != undefined) {
      for(let s of this._Item.status) {
        if(s.type == type) {
          this._AddStatusChangeEvent(s.sensor, service, func);
        }
      }
    }
  }
  
  _ServiceSwitch() {
    const service = new Service.Switch(this._Name);
    service.getCharacteristic(Characteristic.On).on('get', (callback) => {
      const value = this._SearchStatus();
      if(value == "On") {
        callback(null, true);
      } else {
        callback(null, false);
      }
    });
    service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
      if(this._Item.buttons != undefined) {
        if(value) {
          if((this._Item.buttons[0] != undefined) && (this._Item.buttons[0].command)) {
            this._SendCommand(this._Item.buttons[0].command);
          }
        } else {
          if((this._Item.buttons[1] != undefined) && (this._Item.buttons[1].command)) {
            this._SendCommand(this._Item.buttons[1].command);
          } else if((this._Item.buttons[0] != undefined) && (this._Item.buttons[0].command)) {
            this._SendCommand(this._Item.buttons[0].command);
          }
        }
      }
      callback();
    });
    this._AddStatusChange(service, (service, value) => {
      if(value == "On") {
        service.setCharacteristic(Characteristic.On, true);
      } else {
        service.setCharacteristic(Characteristic.On, false);
      }
    });
    return service;
  }
  
  _ServiceLockMechanism() {
    const service = new Service.LockMechanism(this._Name);
    service.getCharacteristic(Characteristic.LockCurrentState).on('get', (callback) => {
      const value = this._SearchStatus();
      if(value == "Close") {
        callback(null, Characteristic.LockCurrentState.SECURED);
      } else {
        callback(null, Characteristic.LockCurrentState.UNSECURED);
      }
    });
    service.getCharacteristic(Characteristic.LockTargetState).on('get', (callback) => {
      const value = this._SearchStatus();
      if(value == "Close") {
        callback(null, Characteristic.LockTargetState.SECURED);
      } else {
        callback(null, Characteristic.LockTargetState.UNSECURED);
      }
    });
    service.getCharacteristic(Characteristic.LockTargetState).on('set', (value, callback) => {
      if(this._Item.buttons != undefined) {
        if(value == Characteristic.LockTargetState.UNSECURED) {
          if((this._Item.buttons[0] != undefined) && (this._Item.buttons[0].command)) {
            this._SendCommand(this._Item.buttons[0].command);
          }
        } else {
          if((this._Item.buttons[1] != undefined) && (this._Item.buttons[1].command)) {
            this._SendCommand(this._Item.buttons[1].command);
          }
        }
      }
      callback();
    });
    this._AddStatusChange(service, (service, value) => {
      if(value == "Close") {
        service.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
      } else {
        service.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
      }
    });
    return service;
  }

  _ServiceWindow() {
    let service;
    if(this._Item.type == 'window') service = new Service.Window(this._Name);
    if(this._Item.type == 'windowCovering') service = new Service.WindowCovering(this._Name);
    service.getCharacteristic(Characteristic.CurrentPosition).on('get', (callback) => {
      const value = this._SearchStatus();
      if((value == 'Open') || (value == 'Opening')) {
        callback(null, 100);
      } else {
        callback(null, 0);
      }
    })
    .setProps({minStep:100});
    service.getCharacteristic(Characteristic.TargetPosition).on('get', (callback) => {
      const value = this._SearchStatus();
      if((value == 'Open') || (value == 'Opening')) {
        callback(null, 100);
      } else {
        callback(null, 0);
      }
    })
    .setProps({minStep:100});
    service.getCharacteristic(Characteristic.TargetPosition).on('set', (value, callback) => {
      if(this._Item.buttons != undefined) {
        if(value) {
          if((this._Item.buttons[0] != undefined) && (this._Item.buttons[0].command)) {
            this._SendCommand(this._Item.buttons[0].command);
          }
        } else {
          if((this._Item.buttons[1] != undefined) && (this._Item.buttons[1].command)) {
            this._SendCommand(this._Item.buttons[1].command);
          }
        }
      }
      callback();
    });
    service.getCharacteristic(Characteristic.PositionState).on('get', (callback) => {
      const value = this._SearchStatus();
      if(value == 'Opening') {
        callback(null, Characteristic.PositionState.INCREASING);
      } else if(value == 'Closing') {
        callback(null, Characteristic.PositionState.DECREASING);
      } else {
        callback(null, Characteristic.PositionState.STOPPED);
      }
    });
    this._AddStatusChange(service, (service, value) => {
      if((value == 'Open') || (value == 'Opening')) {
        service.setCharacteristic(Characteristic.CurrentPosition, 100);
      } else {
        service.setCharacteristic(Characteristic.CurrentPosition, 0);
      }
      if(value == 'Opening') {
        service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.INCREASING);
      } else if(value == 'Closing') {
        service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.DECREASING);
      } else {
        service.setCharacteristic(Characteristic.PositionState, Characteristic.PositionState.STOPPED);
      }
    });
    return service;
  }

  _ServiceThermostat() {
    const service = new Service.Thermostat(this._Name);
    service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).on('get', (callback) => {
      const value = this._SearchStatus();
      const temp = parseFloat(this._SearchStatus('temp'));
      let v = Characteristic.CurrentHeatingCoolingState.OFF;
      if(value == 'On') {
        v = Characteristic.CurrentHeatingCoolingState.HEAT;
        if(temp > 24) v = Characteristic.CurrentHeatingCoolingState.COOL;
      }
      callback(null, v);
    });
    service.getCharacteristic(Characteristic.TargetHeatingCoolingState).on('get', (callback) => {
      const value = this._SearchStatus();
      const temp = parseFloat(this._SearchStatus('temp'));
      let v = Characteristic.CurrentHeatingCoolingState.OFF;
      if(value == 'On') {
        v = Characteristic.CurrentHeatingCoolingState.HEAT;
        if(temp > 24) v = Characteristic.CurrentHeatingCoolingState.COOL;
      }
      callback(null, v);
    });
    service.getCharacteristic(Characteristic.TargetHeatingCoolingState).on('set', (value, callback) => {
      if(value == Characteristic.CurrentHeatingCoolingState.OFF) {
        this._SendCommand(this._Item.commandPrefix + this._Item.buttons[0].command);
      } else {
        this.currentHeatingCoolingState = value;
      }
      callback();
    });
    service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {
      const temp = parseFloat(this._SearchStatus('temp'));
      callback(null, temp);
    })
    .setProps({minValue:-40});
    service.getCharacteristic(Characteristic.TargetTemperature).on('get', (callback) => {
      const temp = Math.round(parseFloat(this._SearchStatus('temp')));
      callback(null, temp);
    })
    .setProps({minStep:1.0});
    service.getCharacteristic(Characteristic.TargetTemperature).on('set', (value, callback) => {
      const v = Math.floor(value);
      let m = 'heater';
      if(v > 24) m = 'cooler';
      const airconTable = this._GetClientUi(this._Item.table);
      for(let mode of airconTable) {
        if(mode.label == m) {
          if(v < mode.min) v = mode.min;
          if(v > mode.max) v = mode.max;
          this._SendCommand(this._Item.commandPrefix + mode.commandSuffix + v.toString());
          break;
        }
      }
      callback();
    });
    service.getCharacteristic(Characteristic.TemperatureDisplayUnits).on('get', (callback) => {
      callback(null, Characteristic.TemperatureDisplayUnits.CELSIUS);
    });
    service.getCharacteristic(Characteristic.TemperatureDisplayUnits).on('set', (value, callback) => {
      callback();
    });
    this._AddStatusChange(service, (service, value) => {
      service.setCharacteristic(Characteristic.CurrentTemperature, parseFloat(value));
    }, 'temp');
    return service;
  }

  _ServiceBatteryService() {
    const service = new Service.BatteryService(this._Name);
    service.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
      const value = (parseFloat(this._GetStatus(this._Item.sensor)) - 12000) / 10;
      callback(null, value);
    });
    service.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => {
      callback(null, Characteristic.ChargingState.NOT_CHARGING);
    });
    service.getCharacteristic(Characteristic.StatusLowBattery).on('get', (callback) => {
      callback(null, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
    });
    this._AddStatusChange(service, (service, value) => {
      service.setCharacteristic(Characteristic.BatteryLevel, (parseFloat(value) - 12000) / 10);
    }, 'battery');
    return service;
  }
  
  _ServiceTemperatureSensor() {
    const service = new Service.TemperatureSensor(this._Name);
    service.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {
      const value = parseFloat(this._GetStatus(this._Item.sensor));
      callback(null, value);
    })
    .setProps({minValue:-40});
    this._AddStatusChange(service, (service, value) => {
      service.setCharacteristic(Characteristic.CurrentTemperature, parseFloat(value));
    }, 'temp');
    return service;
  }

  _ServiceHumiditySensor() {
    const service = new Service.HumiditySensor(this._Name);
    service.getCharacteristic(Characteristic.CurrentRelativeHumidity).on('get', (callback) => {
      const value = parseFloat(this._GetStatus(this._Item.sensor));
      callback(null, value);
    });
    this._AddStatusChange(service, (service, value) => {
      service.setCharacteristic(Characteristic.CurrentRelativeHumidity, parseFloat(value));
    }, 'temp');
    return service;
  }
}

module.exports = HA1Accessory;
