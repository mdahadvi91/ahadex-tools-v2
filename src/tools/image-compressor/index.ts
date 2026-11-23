/**
 * Image Compressor tool main entry point.
 * Exports page composition, metadata, SEO configuration, keywords,
 * JSON-LD schema builder, content, FAQ, and interactive wizard.
 */

import Content from './Content';
import * as content from './content';
import FAQ from './FAQ';
import Hero from './Hero';
import { keywords } from './keywords';
import { manifest } from './manifest';
import { metadata } from './metadata';
import Page from './Page';
import { buildSchema } from './schema';
import { metadata as seo, ogImageAlt } from './seo';
import Tool from './Tool';
import Wizard from './Wizard';

export {
  Content,
  FAQ,
  Hero,
  Page,
  Tool,
  Wizard,
  buildSchema,
  content,
  keywords,
  manifest,
  metadata,
  ogImageAlt,
  seo,
};

export default Page;
