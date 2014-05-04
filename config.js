module.exports = {
  // The title of the blog (duh)
  blogTitle: 'Rarely needed',

  // Directory from which .md files are processed
  postDir: 'posts',

  // Include directory (headers, footers)
  includes: {
    dir: 'includes',
    post: {
      dir: 'post',
      header: 'header.html',
      footer: 'footer.html'
    },
    landing: {
      dir: 'landing',
      header: 'header.html',
      footer: 'footer.html',
      post: 'post.html'
    }
  },

  // Destination directory for the compiled end product
  distDir: 'dist',

  // Number of posts on landing page
  postsOnLandingPage: 2,

  // Date format string for post publication dates,
  // anything from http://momentjs.com/docs/#/displaying/format/ works
  dateFormat: "dddd, MMMM Do YYYY, hh:mm"
}