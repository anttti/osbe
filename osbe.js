#!/usr/bin/env node

const generator = require('./app/generator'),
      rss = require('./app/rss'),
      config = require('./config')(new Date().getTime());

generator.copyPosts(config)
  .then(generator.processPosts)
  .then(generator.sortPosts)
  .then(generator.generateArchives)
  .then(generator.createArchives)
  .then(generator.createLanding)
  .then(rss.createRSS)
  .then(generator.copyResources)
  .done(generator.done);
