# OSBE - Opinionated Static Blog Engine

Just a simple static blog engine for my own personal needs. You will probably be better off using [Jekyll](https://github.com/jekyll/jekyll) or something.

## Usage

- run `npm install`
- write blog posts as `.md` files under `/posts/[YEAR]/[MONTH]/[DAY]`
- run `./osbe.js`
- put the contents of the `/dist` directory on the web somewhere
- profit

## Customization

See configuration options in `config.js`.

Also check under `/includes`. By default everything under `/posts` will be copied to `/dist`, including any custom styles or custom pages.