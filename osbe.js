#!/usr/bin/env node

const generator = require('./app/generator');

generator.copyPosts(require('./config'))
  .then(generator.processPosts)
  .then(generator.createLanding)
  .then(generator.createArchives)
  .catch(function(e) {
    console.log("An error occurred", e);
  })
  .done(function() {
    console.log("All done!");
  });
