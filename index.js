/* jshint node: true */
'use strict';

var path = require('path');
var commands = require('./lib/commands');

module.exports = {
  name: 'courb-contract',

  blueprintsPath: function() {
    return path.join(__dirname, 'blueprints');
  },

  includedCommands: function() {
    return commands;
  }

};
