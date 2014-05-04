const 
  fs = require('fs'),
  path = require('path'),
  markdown = require('markdown').markdown,
  moment = require('moment'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  utils = require('./utils');

function createArchives(settings) {
  console.log("Create archives");
  return new Promise(function(resolve, reject) {
    resolve(settings);
  });
}

function createLanding(settings) {
  var landingIncDir = path.join(settings.includeDir, 'landing'),
      landingHeader = fs.readFileSync(path.join(landingIncDir, 'header.html'), 'utf-8'),
      landingFooter = fs.readFileSync(path.join(landingIncDir, 'footer.html'), 'utf-8'),
      landingPost = fs.readFileSync(path.join(landingIncDir, 'post.html'), 'utf-8');

  return new Promise(function(resolve, reject) {
    var landingPageHtml = landingHeader;
    utils.last(settings.postsOnLandingPage, settings.posts).forEach(function(post) {
      landingPageHtml += landingPost.replace('{{link}}', post.postHtmlFileName)
                                    .replace('{{title}}', post.title)
                                    .replace('{{excerpt}}', post.excerpt)
                                    .replace('{{date}}', moment(post.date).format(settings.dateFormat));
    });
    landingPageHtml += landingFooter;

    fs.writeFile(path.join(settings.distDir, 'index.html'), landingPageHtml, function(err) {
      if (err) return reject(err);
      resolve(settings);
    });
  });
}

function processPosts(settings) {
  var postIncDir = path.join(settings.includeDir, 'post'),
      landingIncDir = path.join(settings.includeDir, 'landing'),
      postHeader = fs.readFileSync(path.join(postIncDir, 'header.html'), 'utf-8'),
      postFooter = fs.readFileSync(path.join(postIncDir, 'footer.html'), 'utf-8');

  return new Promise(function(resolve, reject) {
    utils.walk(settings.distDir, function(err, filePaths) {
      if (err) return reject(err);

      var posts = [];
      filePaths.filter(utils.isMarkdownFile).forEach(function(filePath) {
        posts.push(_getPostContent(filePath, settings).then(_writePost));
      });
      Promise.all(posts).then(function(results) {
        delete settings.post;
        resolve(_.extend(settings, { posts: results }));
      });
    });
  });
}

function _getPostContent(filePath, settings) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf-8', function(err, text) {
      if (err) return reject(err);

      var splitText = text.split('\n'),
          post = {
            title: splitText[1].replace('title: ', ''),
            date: moment(splitText[0].replace('date: ', ''), 'YYYY-MM-DD hh:mm'),
            text: markdown.toHTML(splitText.slice(3, splitText.length).join('\n')),
            excerpt: markdown.toHTML(splitText[5]),
            filePath: filePath
          };

      resolve(_.extend(settings, { post: post }));
    });
  });
}

function _writePost(settings) {
  var postHeader = utils.getPart(path.join(settings.includeDir, 'post', 'header.html')),
      postFooter = utils.getPart(path.join(settings.includeDir, 'post', 'footer.html'));

  return new Promise(function(resolve, reject) {
    var postHtml = postHeader.replace('{{title}}', settings.post.title) + settings.post.text + 
                    postFooter.replace('{{date}}', settings.post.date.format(settings.dateFormat)),
        postHtmlFileName = settings.post.filePath.replace('.md', '.html'),
        postClone = _.cloneDeep(settings.post);
    fs.writeFile(postHtmlFileName, postHtml, function(err) {
      if (err) {
        reject(err);
      } else {
        var post = _.extend(postClone, {
          html: postHtml,
          postHtmlFileName: postHtmlFileName.replace(settings.distDir + '/', '')
        });
        resolve(post);
      }
    });
  });
}

module.exports = {
  processPosts: processPosts,
  createLanding: createLanding,
  createArchives: createArchives
};