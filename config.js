module.exports = function(start) {
  return {
    // The title of the blog (duh)
    blogTitle: 'Rarely needed',

    // Directory for static resources (e.g. CSS, fonts)
    // Copied as-is to distDir
    resourceDir: 'static',

    // Directory from which .md files are processed
    postDir: 'posts',

    // Include directories and files (headers, footers)
    includes: {
      dir: 'includes',
      post: {
        dir: 'post',
        header: 'header.html',
        footer: 'footer.html'
      },
      listing: {
        dir: 'listing',
        header: 'header.html',
        footer: 'footer.html',
        post: 'post.html'
      }
    },

    // Destination directory for the compiled end product
    distDir: 'dist',

    // Number of posts on landing page
    postsOnLandingPage: 3,

    // Date format string for post publication dates,
    // anything from http://momentjs.com/docs/#/displaying/format/ works
    dateFormat: "dddd, MMMM Do YYYY, hh:mm",

    // Start timestamp (don't touch)
    start: start
  }
}