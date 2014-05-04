const 
  fs = require('fs'),
  path = require('path'),
  markdown = require('markdown').markdown,
  moment = require('moment'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  ncp = require('ncp'),
  utils = require('./utils');

/**
 * Copy the whole /posts -dir to /dist
 */
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

// TODO: Create archive pages (Yearly? Monthly?)
function createArchives(settings) {
  return new Promise(function(resolve, reject) {
    resolve(settings);
  });
}

/**
 * Generate the landing page with X last post excerpts
 */
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

/**
 * Transform all .md files under /dist into .html
 */
function processPosts(settings) {
  var postIncDir = path.join(settings.includes.dir, settings.includes.post.dir),
      postHeader = fs.readFileSync(path.join(postIncDir, settings.includes.post.header), 'utf-8'),
      postFooter = fs.readFileSync(path.join(postIncDir, settings.includes.post.footer), 'utf-8');

  return new Promise(function(resolve, reject) {
    utils.walk(settings.distDir, function(err, filePaths) {
      if (err) return reject(err);

      var posts = [];
      filePaths.filter(utils.isMarkdownFile).forEach(function(filePath) {
        posts.push(_getPostContent(filePath, settings).then(_writePostToFile));
      });
      Promise.all(posts).then(function(results) {
        delete settings.post;
        resolve(_.extend(settings, { posts: results }));
      });
    });
  });
}

/**
 * Sort posts chronologically
 */
function sortPosts(settings) {
  return new Promise(function(resolve, reject) {
    settings.posts = settings.posts.sort(function(a, b) { return b.timestamp - a.timestamp; });
    resolve(settings);
  });
}

/**
 * Read a single .md file from the dist and
 * convert it into HTML
 */
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

/**
 * Write a single post to file
 */
function _writePostToFile(settings) {
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

/**
 * Compile a post by concatenating a header, the actual post content
 * and a footer. Go through the file and replace {{tags}}.
 */
function _compilePost(settings) {
  var postIncDir = path.join(settings.includes.dir, settings.includes.post.dir),
      postHeader = utils.getPart(path.join(postIncDir, settings.includes.post.header)),
      postFooter = utils.getPart(path.join(postIncDir, settings.includes.post.footer));
      postHtml = postHeader + settings.post.text + postFooter;

  postHtml = utils.replaceTags(postHtml, { title: settings.post.title,
                                           blogTitle: settings.blogTitle,  
                                           date: settings.post.date });

  return postHtml;
}

module.exports = {
  copyPosts: copyPosts,
  processPosts: processPosts,
  sortPosts: sortPosts,
  createLanding: createLanding,
  createArchives: createArchives
};