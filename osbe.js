#!/usr/bin/env node

const
  Promise = require('bluebird'),
  generator = require('./app/generator'),
  utils = require('./app/utils');

const SETTINGS = require('./config');

utils.copyPosts(SETTINGS)
  .then(generator.processPosts)
  .then(generator.createLanding)
  .then(generator.createArchives)
  .catch(function(e) {
    console.log("An error occurred", e);
  })
  .done(function() {
    console.log("All done!");
  });
