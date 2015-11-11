# Courb-contract

**WIP prototype** with the goal to integrate API-contract payload fixtures into an Ember-CLI test suite, and ensure compatibility between server and client API interfaces.

The addon will take a remote contract repository, look for `data.json` files and copy them, wrapped as ES6 modules, into a local fixtures directory.

## Requirements

* The module has `nodegit` as dependency, which binds to `libgit2`. There might be problems during compilation and `libgit2` might need to be installed separately. E.g. with homebrew on Mac OS X you can do `brew install libgit2`.

* Minimal configuration file

      // config/contract.js
      module.exports = {
        repoUrl: 'contract-repo-url',
        githubToken: 'github-token',
        fixtureDir: 'local-fixtures-directory'
      };

## Installation

    ember install courb-contract


## Available commands

* `ember contract:sync` ... update local fixtures with remote data
