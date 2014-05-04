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

### Special tags available in includes

- `{{blogTitle}}`
- `{{date}}`
- `{{title}}`
- `{{excerpt}}`
- `{{link}}`

## Post format

Posts need to be in the following format or else:

```markdown
date: YYYY-MM-DD hh:mm
title: My blog post

# My blog post

This first chapter will be used as the excerpt. OSBE is naively just taking the 5th index from an array that's created by reading this .md file in and splitting it by every \n.

This second chapter and all that follows will only be displayed in the single post page.
```