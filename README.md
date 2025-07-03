# rehype-mdx-toc

[![github actions](https://github.com/boning-w/rehype-mdx-toc/actions/workflows/ci.yml/badge.svg)](https://github.com/boning-w/rehype-mdx-toc/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/boning-w/rehype-mdx-toc/graph/badge.svg?token=5GBJECAL34)](https://codecov.io/github/boning-w/rehype-mdx-toc)
[![license](https://img.shields.io/github/license/boning-w/rehype-mdx-toc)](https://github.com/boning-w/rehype-mdx-toc/blob/main/LICENSE)

A rehype plugin to create the table of contents and convert it into MDX exports.

## Table of Contents

- [What is this?](#what-is-this)
- [When should I use this?](#when-should-i-use-this)
- [Install](#install)
- [Usage](#usage)
  - [✅ For `@mdx-js/mdx`](#-for-mdx-jsmdx)
  - [✅ For `mdx-bundler`](#-for-mdx-bundler)
  - [🚫 For `next-mdx-remote`](#-for-next-mdx-remote)
- [API](#api)
  - [Options](#options)
- [Types](#types)
- [License](#license)

## What is this?

This package is a [unified](https://unifiedjs.com/) ([rehype](https://rehypejs.github.io/rehype/)) plugin that generates a table of contents (TOC) from headings in your MDX files and converts it into MDX exports.

## When should I use this?

This plugin is useful when you want a table of contents data that is exported from MDX modules, which can then be used everwhere in your application.

## Install

You can install this package using npm:

```shell
npm install rehype-mdx-toc
```

## Usage

Say we have mdx contents like this:

```mdx
# Heading 1

## Heading 2

### Heading 3
```

...and our module `example.js` contains:

```js
import { compile, run } from "@mdx-js/mdx";
import rehypeMdxToc from "rehype-mdx-toc";
import * as runtime from "react/jsx-runtime";

const mdxContent = `
# Heading 1
## Heading 2
### Heading 3
`;

const compiled = await compile(mdxContent, {
  outputFormat: "function-body",
  rehypePlugins: [rehypeMdxToc],
});
const result = await run(compiled, { ...runtime });
const toc = result.toc;
console.log(toc);
```

...then running `node example.js` will output:

```json
[
  {
    "depth": 1,
    "value": "Heading 1",
    "numbering": [1, 0, 0, 0, 0, 0],
    "id": undefined,
    "href": undefined
  },
  {
    "depth": 2,
    "value": "Heading 2",
    "numbering": [1, 1, 0, 0, 0, 0],
    "id": undefined,
    "href": undefined
  },
  {
    "depth": 3,
    "value": "Heading 3",
    "numbering": [1, 1, 1, 0, 0, 0],
    "id": undefined,
    "href": undefined
  }
]
```

### Use with `rehype-slug`

To generate `id` and `href` properties for each TOC item, you can use the `rehype-slug` plugin before `rehype-mdx-toc`. This will automatically add `id` attributes to headings based on their text content.

```js
import { compile, run } from "@mdx-js/mdx";
import rehypeSlug from "rehype-slug";
import rehypeMdxToc from "rehype-mdx-toc";
import * as runtime from "react/jsx-runtime";

const mdxContent = `
# Heading 1
## Heading 2
### Heading 3
`;

const compiled = await compile(mdxContent, {
  outputFormat: "function-body",
  rehypePlugins: [rehypeSlug, rehypeMdxToc],
});
const result = await run(compiled, { ...runtime });
const toc = result.toc;
console.log(toc);
```

This will output:

```json
[
  {
    "depth": 1,
    "value": "Heading 1",
    "numbering": [1, 0, 0, 0, 0, 0],
    "id": "heading-1",
    "href": "#heading-1"
  },
  {
    "depth": 2,
    "value": "Heading 2",
    "numbering": [1, 1, 0, 0, 0, 0],
    "id": "heading-2",
    "href": "#heading-2"
  },
  {
    "depth": 3,
    "value": "Heading 3",
    "numbering": [1, 1, 1, 0, 0, 0],
    "id": "heading-3",
    "href": "#heading-3"
  }
]
```

### ✅ For `@mdx-js/mdx`

See [Usage](#usage) and [Use with rehype-slug](#use-with-rehype-slug) sections above.

### ✅ For `mdx-bundler`

For `mdx-bundler`, you can add this plugin to `bundleMDX()`'s mdxOptions:

```js
bundleMDX({
  source: mdxSource,
  mdxOptions(options, frontmatter) {
    options.rehypePlugins = [...(options.rehypePlugins ?? []), rehypeMdxToc];
    return options;
  },
});
```

> See [mdx-bundler#Accessing named exports](https://github.com/kentcdodds/mdx-bundler?tab=readme-ov-file#accessing-named-exports)
> 
> To access the `toc` export, You can use `getMDXExport` instead of `getMDXComponent` to treat the mdx file as a module instead of just a component.

```js
import { getMDXExport } from "mdx-bundler/client";

function MDXPage({ code }: { code: string }) {
  const mdxExport = getMDXExport(code);
  console.log(mdxExport.toc); // 👈 get toc export here

  const Component = React.useMemo(() => mdxExport.default, [code]);

  return <Component />;
}
```

### 🚫 For `next-mdx-remote`

This plugin is not compatible with `next-mdx-remote` because `next-mdx-remote` does not support `import` and `export` statements in MDX files.

See [import/export caveats of next-mdx-remote](https://github.com/hashicorp/next-mdx-remote?tab=readme-ov-file#import--export)

> `import` and `export` statements cannot be used inside an MDX file.
>
> ...As for exports, the MDX content is treated as data, not a module, so there is no way for us to access any value which may be exported from the MDX passed to `next-mdx-remote`.

## API

The default export is the rehype plugin function.

### Options

- `default`: The default value to export if no headings. (Default: undefined).
- `name`: The name of the export. (Default: "toc").
- `skipDepth`: An array of heading depths to skip. If specified, headings of these depths will not be included in the TOC. (Default: `[]`).

## Types

This package is fully typed with [TypeScript](https://www.typescriptlang.org/). The plugin exports the types `HeadingDepth`, `RehypeMdxTocOptions`, `TocItem`.

Mostly, you only need the `TocItem` type in your project:

```ts
export type TocItem = {
  depth: HeadingDepth; // The level of the heading (1 for `<h1>`, 2 for `<h2>`, etc.).
  value: string; // The text content of the heading.
  numbering: number[]; //  An array representing the hierarchical numbering of the heading.
  id?: string; // The ID of the heading, if available.
  href?: string; // The link to the heading.
  data?: Record<string, unknown>;
};
```

## License

[MIT](https://github.com/boning-w/rehype-mdx-toc/blob/main/LICENSE)
