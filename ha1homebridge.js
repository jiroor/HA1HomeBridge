//
// ha1homebridge.js
//

'use strict';

const fs = require('fs');
const ha1platform = require('./ha1platform');

process.on('uncaughtException', (err) => {
  console.log('----');
  console.log('[[ Exception ]]');
  console.log(Date());
  console.log(err);
  console.log(err.stack);
  console.log('----');
});

let user = null;
let configFile = null;
for(let i = 2; i < process.argv.length; i++) {
  if(process.argv[i] == '-u') {
    if(i + 1 < process.argv.length) user = process.argv[i + 1];
    i++;
  }
  if(process.argv[i] == '-c') {
    if(i + 1 < process.argv.length) configFile = process.argv[i + 1];
    i++;
  }
}

try {
  if(user) process.setuid(user);
} catch(e) {
  console.log('Fail to setuid: %s', user);
  console.log('usage: %s %s -u <user> -c <configFile>');
}

try {
  const platform = new ha1platform(JSON.parse(fs.readFileSync(configFile || './config.json')));
}
catch (err) {
  console.log("config parse error");
  console.log(err);
  throw err;
}


