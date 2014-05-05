const
  path = require('path'),
  Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  RSS = require('rss'),
  utils = require('./utils');

function createRSS(data) {
  'use strict';
  return new Promise(function(resolve, reject) {
    var feed = new RSS({
      title: data.config.rss.title,
      description: data.config.rss.description,
      generator: 'OSBE',
      feed_url: data.config.siteUrl + data.config.rss.fileName,
      site_url: data.config.siteUrl,
      author: data.config.author
    });

    utils.first(10, data.posts).forEach(function(post) {
      feed.item({
        title: post.title,
        description: post.html.replace(/((.|\n)*?)section class="post content">/, '')
                              .replace(/<\/body>(.|\n)*/, ''),
        url: data.config.siteUrl + post.postHtmlFileName,
        author: data.config.author,
        date: post.timestamp,
      })
    });

    var rssFile = path.join(data.config.distDir, data.config.rss.fileName);
    fs.writeFileAsync(rssFile, feed.xml()).then(function() {
      resolve(data);
    });
  });
}

module.exports = {
  createRSS: createRSS
};