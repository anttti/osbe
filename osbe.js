#!/usr/bin/env node

const generator = require('./app/generator'),
      config = require('./config');

generator.copyPosts(config)
  .then(generator.processPosts)
  .then(generator.sortPosts)
  .then(generator.createArchives)
  .then(generator.createLanding)
  .done(generator.done);
