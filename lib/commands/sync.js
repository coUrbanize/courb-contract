/* jshint node: true */
'use strict';

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var Git = require('nodegit');
var dir = require('node-dir');

// RSVP wrapper
var Promise = require('ember-cli/lib/ext/promise');

var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);
var files = Promise.denodeify(dir.files);

var chalk = require('chalk');

module.exports = {
    name: 'contract:sync',
    description: 'Sync coUrbanize API contract',

    availableOptions: [
      { name: 'contract-config-file', type: String, default: 'config/contract.js' },
    ],

    // TODO refactor that spagetti once we have a better understanding of
    //      possible use cases
    run: function(commandOptions /*, rawArgs */) {
      const message = 'Syncing coUrbanize API contract...';
      const ui = this.ui;

      ui.writeLine(message);

      // contract config
      const root = this.project.root;
      const filePath = commandOptions.contractConfigFile;
      const fullPath = path.join(root, filePath);

      // FIXME this is how you check for exising files in node?
      let config;
      try {
        config = require(fullPath);
      } catch (err) {
        ui.writeLine(chalk.red('No `config/contract.js` found.'));
        return false;
      }

      const localRepo = 'tmp/contract-repo';
      const githubToken = config.githubToken;
      const remoteRepo = config.repoUrl;
      const fixtureDir = config.fixtureDir;

      // TODO only use credentials when we see a token
      const options = {
        fetchOpts: {
          callbacks: {
            // Workaround for Mac OS X GitHub Cert issue...
            certificateCheck: function() {
              return 1;
            },
            credentials: function() {
              return Git.Cred.userpassPlaintextNew(githubToken, "x-oauth-basic");
            }
          }
        }
      };

      // Clone contract repo
      return Git.Clone(remoteRepo, localRepo, options)

      // find 'data.json' files in directory
      .then(function() {
        return files(localRepo);
      })
      .then(function(files) {
        return files.filter(function(file) {
          return file.slice(-9) === 'data.json';
        });
      })

      // copy JSON => ES6 module fixtures
      .then(function(files) {
        var promises = files.map(function(file) {
          const fixtureFileName = `${fixtureDir}/${file.slice(localRepo.length + 1, -10).replace(/\//g, '-')}.js`;

          return readFile(file)
          .then(function(fileContent) {
            const prefix = new Buffer('export default ');
            const postfix = new Buffer(';');
            const buffers = [prefix, fileContent, postfix];
            const totalLength = buffers.reduce(function(prev, buffer) {
              return prev + buffer.length;
            }, 0);

            return Buffer.concat(buffers, totalLength);
          })
          // write to fixture
          .then(function(fixtureContent) {
            ui.writeLine(`Updating ${fixtureFileName}`);

            return writeFile(fixtureFileName, fixtureContent);
          });
        });

        return Promise.all(promises);
      })
      .then(function() {
        return new Promise(function(resolve, reject) {
          // cleanup repo
          // ...nodegit can't pull (?)
          exec(`rm -r ${localRepo}`, function (err) {
            if (!err) {
              resolve();
            }
            else {
              reject(err);
            }
          });
        });
      })

      // error handler
      .catch(function(err) {
        ui.writeLine(chalk.red(err));
      });
    }
};
