import { valueToEstree } from "estree-util-value-to-estree";
import type { Root } from "hast";
import { headingRank } from "hast-util-heading-rank";
import { toString as getNodeValue } from "hast-util-to-string";
import { define } from "unist-util-mdx-define";
import { CONTINUE, visit } from "unist-util-visit";
import type { VFile } from "vfile";

/**
 * Type representing the depth of headings in a table of contents.
 * This is used to specify which heading levels (h1, h2, etc.) should be included
 * in the table of contents.
 *
 * The values correspond to HTML heading elements:
 * - 1 for `<h1>`
 * - 2 for `<h2>`
 * - 3 for `<h3>`
 * - 4 for `<h4>`
 * - 5 for `<h5>`
 * - 6 for `<h6>`
 */
export type HeadingDepth = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Options for the rehype-mdx-toc plugin.
 *
 * This type defines the configuration options that can be passed to the plugin.
 * - `default`: Optional default value for the table of contents when no headings are found.
 * - `name`: The name of the export variable for the table of contents.
 */
export type RehypeMdxTocOptions = {
  /**
   * Optional default value for the table of contents.
   * If provided, this will be used when no headings are found.
   *
   * @default undefined
   */
  default?: unknown;

  /**
   * The name of the export variable for the table of contents.
   *
   * @default "toc"
   */
  name?: string;

  /**
   * An array of heading depths to skip.
   * If specified, headings of these depths will not be included in the TOC.
   *
   * @default []
   */
  skipDepth?: HeadingDepth[];
};

/**
 * Represents a single item in the table of contents (TOC).
 *
 * Each item corresponds to a heading in the MDX file and includes:
 * - `depth`: The level of the heading (1 for `<h1>`, 2 for `<h2>`, etc.).
 * - `value`: The text content of the heading.
 * - `numbering`: An array representing the hierarchical numbering of the heading.
 * - `id`: The ID of the heading, if available.
 * - `href`: The link to the heading, typically a fragment identifier.
 * - `data`: Additional data associated with the heading.
 */
export type TocItem = {
  depth: HeadingDepth;
  value: string;
  numbering: number[];
  id?: string;
  href?: string;
  data?: Record<string, unknown>;
};

/**
 * Rehype plugin to generate a table of contents (TOC) for MDX files.
 *
 * This plugin processes the HAST tree to find all headings and constructs a TOC
 * with hierarchical numbering. The TOC is then exported as a variable that can
 * be used in the MDX module.
 *
 * @param options - Optional configuration for the plugin.
 * @returns A function that transforms the HAST tree.
 */
export default function rehypeMdxToc({
  name = "toc",
  ...options
}: RehypeMdxTocOptions = {}) {
  // Return the actual transformer function for rehype.
  return (tree: Root, file: VFile) => {
    // This will hold the final table of contents data.
    const toc: TocItem[] = [];

    // Tracks the current numbering for headings.
    // Each index corresponds to a heading level: [h1, h2, h3, h4, h5, h6].
    const currentNumbering: number[] = [0, 0, 0, 0, 0, 0];

    // Visit every HTML element in the tree.
    visit(tree, "element", (node) => {
      // Check if this element is a heading (<h1>–<h6>).
      const rank = headingRank(node);

      // If the rank is undefined, skip this node.
      if (rank === undefined) return CONTINUE;

      // If the depth is in the skipDepth array, skip this node.
      const depth = rank as HeadingDepth;
      if (options.skipDepth?.includes(depth)) return CONTINUE;

      // Increment the counter for this heading level.
      currentNumbering[depth - 1] += 1;

      // Reset all deeper levels to zero.
      // This ensures the numbering doesn't accidentally carry over.
      for (let i = depth; i < currentNumbering.length; i++) {
        currentNumbering[i] = 0;
      }

      // Add this heading to the TOC array.
      toc.push({
        depth,
        value: getNodeValue(node),
        numbering: [...currentNumbering],
        id: node.properties?.id as string | undefined,
        href: node.properties?.id ? `#${node.properties.id}` : undefined,
      });
    });

    // Attach the TOC as an exported variable in the MDX file.
    const data = toc.length ? toc : options.default;

    define(tree, file, {
      [name]: valueToEstree(data),
    });
  };
}
