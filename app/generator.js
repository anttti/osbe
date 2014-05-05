const
  fs = require('fs'),
  path = require('path'),
  markdown = require('markdown').markdown,
  moment = require('moment'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  ncp = Promise.promisify(require('ncp')),
  utils = require('./utils');

/**
 * Copy the whole /posts -dir to /dist
 */
function copyPosts(config) {
  'use strict';
  utils.deleteDir(config.distDir);
  return ncp(config.postDir, config.distDir).then(function() {
    return { config: config };
  });
}

/**
 * Transform all .md files under /dist into .html
 */
function processPosts(data) {
  'use strict';
  var postIncDir = path.join(data.config.includes.dir, data.config.includes.post.dir),
      postHeader = fs.readFileSync(path.join(postIncDir, data.config.includes.post.header), 'utf-8'),
      postFooter = fs.readFileSync(path.join(postIncDir, data.config.includes.post.footer), 'utf-8');

  return new Promise(function(resolve, reject) {
    utils.walk(data.config.distDir, function(err, filePaths) {
      if (err) return reject(err);

      var posts = [],
          config = _.cloneDeep(data.config);
      // Parse and write all md files to html
      filePaths.filter(utils.isMarkdownFile).forEach(function(filePath) {
        posts.push(_getPostContent(filePath, config).then(_writePostToFile));
      });
      // Continue when all promises have been fulfilled
      Promise.all(posts).then(function(results) {
        resolve(_.extend(data, { posts: results }));
      });
    });
  });
}

/**
 * Sort posts chronologically
 */
function sortPosts(data) {
  'use strict';
  return new Promise(function(resolve, reject) {
    data.posts = data.posts.sort(function(a, b) { return b.timestamp - a.timestamp; });
    resolve(data);
  });
}

/**
 * Collect posts to months
 */
function generateArchives(data) {
  'use strict';
  return new Promise(function(resolve, reject) {
    var months = utils.collectMonths(data.posts);
    resolve(_.extend(data, { archiveMonths: months }));
  });
}

/**
 * Create the actual archive HTML pages
 */
function createArchives(data) {
  'use strict';
  return new Promise(function(resolve, reject) {
    var fileWrites = [],
        months = _.keys(data.archiveMonths).sort().reverse();
    
    months.forEach(function(month, index) {
      fileWrites.push(_createListing(data.archiveMonths[month], month + '.html', index, months, data)
        .then(_appendArchiveLinks)
        .then(_writeListingToFile)
      );
    });
    
    Promise.all(fileWrites).then(function() {
      resolve(data);
    });
  });
}

/**
 * Generate the landing page with X last post excerpts
 */
function createLanding(data) {
  'use strict';
  var months = _.keys(data.archiveMonths).sort().reverse();

  return new Promise(function(resolve, reject) {
    _createListing(data.archiveMonths[months[0]], 'index.html', 0, months, data)
      .then(_appendArchiveLinks)
      .then(_writeListingToFile)
      .then(function() {
        resolve(data);
      });
  });
}

/**
 * Copy static resources to /dist
 */
function copyResources(data) {
  'use strict';
  return ncp(data.config.resourceDir, data.config.distDir).then(function() {
    return data;
  });
}

/**
 * Print out some benchmarking data and greets when doen
 */
function done(data) {
  'use strict';
  var now = new Date().getTime(),
      delta = (now - data.config.start) / 1000;
  console.log('\nAll done! "' + data.config.blogTitle + '" compiled to /' + data.config.distDir + '.\n' +
    'Compilation took', delta, 'seconds.\n' +
    'Thanks for using OSBE. Support your local micro breweries.\n\n  Cheers, @anttti\n');
}

/////////////////////
// PRIVATE METHODS //
/////////////////////

/**
 * Read a single .md file from the dist and
 * convert it into HTML
 */
function _getPostContent(filePath, config) {
  'use strict';
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, 'utf-8', function(err, text) {
      if (err) return reject(err);

      var splitText = text.split('\n'),
          date = moment(splitText[0].replace('date: ', ''), 'YYYY-MM-DD hh:mm'),
          post = {
            title: splitText[1].replace('title: ', ''),
            date: date.format(config.dateFormat),
            timestamp: date.valueOf(),
            text: markdown.toHTML(splitText.slice(3, splitText.length).join('\n')),
            excerpt: markdown.toHTML(splitText[5]),
            filePath: filePath
          };

      resolve(_.extend(config, { post: post }));
    });
  });
}

/**
 * Write a single post to file
 */
function _writePostToFile(config) {
  'use strict';
  return new Promise(function(resolve, reject) {
    var postHtml = _compilePost(config),
        postHtmlFileName = config.post.filePath.replace('.md', '.html'),
        postClone = _.cloneDeep(config.post);
    fs.writeFile(postHtmlFileName, postHtml, function(err) {
      if (err) {
        reject(err);
      } else {
        var post = _.extend(postClone, {
          html: postHtml,
          postHtmlFileName: postHtmlFileName.replace(config.distDir + '/', '')
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
function _compilePost(config) {
  'use strict';
  var postIncDir = path.join(config.includes.dir, config.includes.post.dir),
      postHeader = utils.getPart(path.join(postIncDir, config.includes.post.header)),
      postFooter = utils.getPart(path.join(postIncDir, config.includes.post.footer)),
      postHtml = postHeader + config.post.text + postFooter;

  postHtml = utils.replaceTags(postHtml, { title: config.post.title,
                                           blogTitle: config.blogTitle,
                                           date: config.post.date });

  return postHtml;
}

/**
 * Creates a listing HTML file from an array of posts.
 * Used to generate index.html and archive pages (one per month)
 */
function _createListing(posts, fileName, index, months, data) {
  'use strict';
  var listingIncDir = path.join(data.config.includes.dir, data.config.includes.listing.dir),
      listingHeader = utils.getPart(path.join(listingIncDir, data.config.includes.listing.header)),
      listingFooter = utils.getPart(path.join(listingIncDir, data.config.includes.listing.footer)),
      listingPost = utils.getPart(path.join(listingIncDir, data.config.includes.listing.post)),
      nextPrevUrls = utils.getNextPrevUrls(index, months),
      nextMonthUrl = nextPrevUrls.nextMonthUrl,
      prevMonthUrl = nextPrevUrls.prevMonthUrl,
      monthTitle = moment(months[index], 'YYYY-MM').format('MMMM, YYYY');

  return new Promise(function(resolve, reject) {
    var listingPageHtml = utils.replaceTags(listingHeader, { blogTitle: data.config.blogTitle,
                                                             monthTitle: monthTitle });
    posts.forEach(function(post) {
      listingPageHtml += utils.replaceTags(listingPost, { link: post.postHtmlFileName,
                                                         title: post.title,
                                                         excerpt: post.excerpt,
                                                         date: post.date });
    });
    listingPageHtml += utils.replaceTags(listingFooter, { nextMonthUrl: nextMonthUrl,
                                                          prevMonthUrl: prevMonthUrl });

    resolve({ html: listingPageHtml, fileName: fileName, dir: data.config.distDir, data: data });
  });
}

/**
 * Generate and append archive page links
 */
function _appendArchiveLinks(listing) {
  'use strict';
  return new Promise(function(resolve, reject) {
    var archives = '<ul class="archives--list">', month, date;
    for (month in listing.data.archiveMonths) {
      date = moment(month, 'YYYY-MM');
      archives += '<li><a href="' + month + '.html">' + date.format('MMMM YYYY') + '</a></li>';
    }
    archives += '</ul>';
    listing.html = utils.replaceTags(listing.html, { archives: archives });
    resolve(listing);
  });
}

/**
 * Writes a listing page to file
 */
function _writeListingToFile(listing) {
  'use strict';
  return new Promise(function(resolve, reject) {
    fs.writeFile(path.join(listing.dir, listing.fileName), listing.html, function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  copyPosts: copyPosts,
  processPosts: processPosts,
  sortPosts: sortPosts,
  generateArchives: generateArchives,
  createArchives: createArchives,
  createLanding: createLanding,
  copyResources: copyResources,
  done: done
};
