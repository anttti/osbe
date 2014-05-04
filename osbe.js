#!/usr/bin/env node

const generator = require('./app/generator'),
      config = require('./config')(new Date().getTime());

generator.copyPosts(config)
  .then(generator.processPosts)
  .then(generator.sortPosts)
  .then(generator.generateArchives)
  .then(generator.createArchives)
  .then(generator.createLanding)
  .then(generator.copyResources)
  .done(generator.done);
