const
  Promise = require('bluebird'),
  generator = require('./app/generator'),
  utils = require('./app/utils');

// Settings
const SETTINGS = {
  postDir: 'posts',
  includeDir: 'includes',
  distDir: 'dist',
  postsOnLandingPage: 2,
  dateFormat: "dddd, MMMM Do YYYY, hh:mm"
};

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
