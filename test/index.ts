import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeMdxToc, { type TocItem } from "rehype-mdx-toc";
import rehypeSlug from "rehype-slug";

const source = `
  # The Main Heading

  ## Section _1_

  ### Subheading

  ### Mubheading

  ## Section _2_

  ### \`Subheading\`

  ### [Mubheading](#)

  > #### QuoteHeading
  > Some Content
  > #### **QuoteHeading**
  > Some Content

  + ##### **ListItem** _Heading_
  + ##### _ListItem_ **Heading**
`;

async function getTocFromMdxModule(mdxContent: string) {
  const compiled = await compile(mdxContent, {
    outputFormat: "function-body",
    rehypePlugins: [rehypeMdxToc],
  });
  const result = await run(compiled, { ...runtime });
  const toc = result.toc as TocItem[];
  return toc;
}

async function getTocFromMdxModuleWithRehypeSlug(mdxContent: string) {
  const compiled = await compile(mdxContent, {
    outputFormat: "function-body",
    rehypePlugins: [rehypeSlug, rehypeMdxToc],
  });
  const result = await run(compiled, { ...runtime });
  const toc = result.toc as TocItem[];
  return toc;
}

describe("rehype-mdx-toc", () => {
  it("should export toc to MDX module", async () => {
    const mdx = "# Heading 1";
    const toc = await getTocFromMdxModule(mdx);
    assert.ok(Array.isArray(toc), "Should export toc");
  });

  it("should generate undefined TOC for no headings", async () => {
    const mdx = "This is a test without headings.";
    const toc = await getTocFromMdxModule(mdx);
    assert.ok(
      toc === undefined,
      "Should generate undefined TOC for no headings",
    );
  });

  it("should generate correct TOC structure without heading IDs", async () => {
    const toc = await getTocFromMdxModule(
      "# Heading 1\n\n## Heading 2\n\n### Heading 3",
    );
    assert.deepEqual(toc, [
      {
        depth: 1,
        value: "Heading 1",
        numbering: [1, 0, 0, 0, 0, 0],
        id: undefined,
        href: undefined,
      },
      {
        depth: 2,
        value: "Heading 2",
        numbering: [1, 1, 0, 0, 0, 0],
        id: undefined,
        href: undefined,
      },
      {
        depth: 3,
        value: "Heading 3",
        numbering: [1, 1, 1, 0, 0, 0],
        id: undefined,
        href: undefined,
      },
    ]);
  });

  it("should generate correct TOC structure with heading IDs", async () => {
    const toc = await getTocFromMdxModuleWithRehypeSlug(source);
    assert.deepEqual(toc, [
      {
        depth: 1,
        value: "The Main Heading",
        numbering: [1, 0, 0, 0, 0, 0],
        id: "the-main-heading",
        href: "#the-main-heading",
      },
      {
        depth: 2,
        value: "Section 1",
        numbering: [1, 1, 0, 0, 0, 0],
        id: "section-1",
        href: "#section-1",
      },
      {
        depth: 3,
        value: "Subheading",
        numbering: [1, 1, 1, 0, 0, 0],
        id: "subheading",
        href: "#subheading",
      },
      {
        depth: 3,
        value: "Mubheading",
        numbering: [1, 1, 2, 0, 0, 0],
        id: "mubheading",
        href: "#mubheading",
      },
      {
        depth: 2,
        value: "Section 2",
        numbering: [1, 2, 0, 0, 0, 0],
        id: "section-2",
        href: "#section-2",
      },
      {
        depth: 3,
        value: "Subheading",
        numbering: [1, 2, 1, 0, 0, 0],
        id: "subheading-1",
        href: "#subheading-1",
      },
      {
        depth: 3,
        value: "Mubheading",
        numbering: [1, 2, 2, 0, 0, 0],
        id: "mubheading-1",
        href: "#mubheading-1",
      },
      {
        depth: 4,
        value: "QuoteHeading",
        numbering: [1, 2, 2, 1, 0, 0],
        id: "quoteheading",
        href: "#quoteheading",
      },
      {
        depth: 4,
        value: "QuoteHeading",
        numbering: [1, 2, 2, 2, 0, 0],
        id: "quoteheading-1",
        href: "#quoteheading-1",
      },
      {
        depth: 5,
        value: "ListItem Heading",
        numbering: [1, 2, 2, 2, 1, 0],
        id: "listitem-heading",
        href: "#listitem-heading",
      },
      {
        depth: 5,
        value: "ListItem Heading",
        numbering: [1, 2, 2, 2, 2, 0],
        id: "listitem-heading-1",
        href: "#listitem-heading-1",
      },
    ]);
  });

  it("should export toc with default export name", async () => {
    const toc = await getTocFromMdxModule(source);
    assert.ok(Array.isArray(toc), "should export toc with default export name");
  });

  it("should export toc with custom export name", async () => {
    const compiled = await compile(source, {
      outputFormat: "function-body",
      rehypePlugins: [[rehypeMdxToc, { name: "customToc" }]],
    });
    const result = await run(compiled, { ...runtime });
    assert.ok(
      Array.isArray(result.customToc),
      "Should export toc with custom name",
    );
  });

  it("should export toc with default value (which is undefined) without headings", async () => {
    const mdx = "This is a test without headings.";
    const toc = await getTocFromMdxModule(mdx);
    assert.ok(
      toc === undefined,
      "should export toc with default value (which is undefined) without headings",
    );
  });

  it("should export toc with custom default value without headings", async () => {
    const mdx = "This is a test without headings.";
    const compiled = await compile(mdx, {
      outputFormat: "function-body",
      rehypePlugins: [[rehypeMdxToc, { default: "No headings in this MDX" }]],
    });
    const result = await run(compiled, { ...runtime });
    assert.ok(
      result.toc === "No headings in this MDX",
      "should export toc with custom default value without headings",
    );
  });

  it("should skip headings based on skipDepth option", async () => {
    const mdx = `
      # Heading 1
      ## Heading 2
      ### Heading 3
      #### Heading 4
      #### Heading 4.1
      ##### Heading 5
      ###### Heading 6
      ### Heading 3.1
      #### Heading 4.2
    `;
    const compiled = await compile(mdx, {
      outputFormat: "function-body",
      rehypePlugins: [[rehypeMdxToc, { skipDepth: [1, 2, 5, 6] }]],
    });
    const result = await run(compiled, { ...runtime });
    const toc = result.toc as TocItem[];
    assert.deepEqual(toc, [
      {
        depth: 3,
        value: "Heading 3",
        numbering: [0, 0, 1, 0, 0, 0],
        id: undefined,
        href: undefined,
      },
      {
        depth: 4,
        value: "Heading 4",
        numbering: [0, 0, 1, 1, 0, 0],
        id: undefined,
        href: undefined,
      },
      {
        depth: 4,
        value: "Heading 4.1",
        numbering: [0, 0, 1, 2, 0, 0],
        id: undefined,
        href: undefined,
      },
      {
        depth: 3,
        value: "Heading 3.1",
        numbering: [0, 0, 2, 0, 0, 0],
        id: undefined,
        href: undefined,
      },
      {
        depth: 4,
        value: "Heading 4.2",
        numbering: [0, 0, 2, 1, 0, 0],
        id: undefined,
        href: undefined,
      },
    ]);
  });
});
