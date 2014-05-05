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

The `/static` directory is meant for static resources such as CSS. It's copied to `/dist` as-is.

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

Regular markdown works, OSBE uses [markdown-js](https://github.com/evilstreak/markdown-js) to parse it.

## Great, but where's the support for...

Sass? LESS? Haml? No, no, nope, sorry.

## TODO

- Paging
- RSS feed
- Simple client-side search
- Tests...
