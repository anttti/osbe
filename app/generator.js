const 
  fs = require('fs'),
  path = require('path'),
  markdown = require('markdown').markdown,
  moment = require('moment'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  ncp = require('ncp'),
  utils = require('./utils');

function copyPosts(settings) {
  return new Promise(function(resolve, reject) {
    utils.deleteDir(settings.distDir);
    ncp(settings.postDir, settings.distDir, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(settings);
      }
    });
  });
}

function createArchives(settings) {
  return new Promise(function(resolve, reject) {
    resolve(settings);
  });
}

function createLanding(settings) {
  var landingIncDir = path.join(settings.includes.dir, settings.includes.landing.dir),
      landingHeader = fs.readFileSync(path.join(landingIncDir, settings.includes.landing.header), 'utf-8'),
      landingFooter = fs.readFileSync(path.join(landingIncDir, settings.includes.landing.footer), 'utf-8'),
      landingPost = fs.readFileSync(path.join(landingIncDir, settings.includes.landing.post), 'utf-8');

  return new Promise(function(resolve, reject) {
    var landingPageHtml = landingHeader.replace(/{{blogTitle}}/g, settings.blogTitle);

    utils.first(settings.postsOnLandingPage, settings.posts).forEach(function(post) {
      landingPageHtml += landingPost.replace(/{{link}}/g, post.postHtmlFileName)
                                    .replace(/{{title}}/g, post.title)
                                    .replace(/{{excerpt}}/g, post.excerpt)
                                    .replace(/{{date}}/g, post.date)
    });
    landingPageHtml += landingFooter;

    fs.writeFile(path.join(settings.distDir, 'index.html'), landingPageHtml, function(err) {
      if (err) return reject(err);
      resolve(settings);
    });
  });
}

function processPosts(settings) {
  var postIncDir = path.join(settings.includes.dir, settings.includes.post.dir),
      postHeader = fs.readFileSync(path.join(postIncDir, settings.includes.post.header), 'utf-8'),
      postFooter = fs.readFileSync(path.join(postIncDir, settings.includes.post.footer), 'utf-8');

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

function sortPosts(settings) {
  return new Promise(function(resolve, reject) {
    settings.posts = settings.posts.sort(function(a, b) { return b.timestamp - a.timestamp; });
    resolve(settings);
  });
}

function _getPostContent(filePath, settings) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf-8', function(err, text) {
      if (err) return reject(err);

      var splitText = text.split('\n'),
          date = moment(splitText[0].replace('date: ', ''), 'YYYY-MM-DD hh:mm'),
          post = {
            title: splitText[1].replace('title: ', ''),
            date: date.format(settings.dateFormat),
            timestamp: date.unix(),
            text: markdown.toHTML(splitText.slice(3, splitText.length).join('\n')),
            excerpt: markdown.toHTML(splitText[5]),
            filePath: filePath
          };

      resolve(_.extend(settings, { post: post }));
    });
  });
}

function _writePost(settings) {
  return new Promise(function(resolve, reject) {
    var postHtml = _compilePost(settings),
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

function _compilePost(settings) {
  var postIncDir = path.join(settings.includes.dir, settings.includes.post.dir),
      postHeader = utils.getPart(path.join(postIncDir, settings.includes.post.header)),
      postFooter = utils.getPart(path.join(postIncDir, settings.includes.post.footer));
      postHtml = '';

  postHtml += postHeader.replace(/{{title}}/g, settings.post.title)
                        .replace(/{{blogTitle}}/g, settings.blogTitle);
  postHtml += settings.post.text;
  postHtml += postFooter.replace(/{{date}}/g, settings.post.date);

  return postHtml;
}

module.exports = {
  copyPosts: copyPosts,
  processPosts: processPosts,
  sortPosts: sortPosts,
  createLanding: createLanding,
  createArchives: createArchives
};