import { describe, expect, it } from 'vitest';
import { render } from '../app/entry-server';

describe('Phase 3 Homepage & Static Pages SSR Rendering', () => {
  it('renders Homepage with all required sections and JSON-LD without browser globals', () => {
    const html = render('/');
    expect(html).toContain('Fast, Privacy-First Online File Tools');
    expect(html).toContain('Popular Tools');
    expect(html).toContain('All Tools');
    expect(html).toContain('Search tools');
    expect(html).toContain('Browse by Category');
    expect(html).toContain('How It Works');
    expect(html).toContain('Why Choose AHADEX Tools?');
    expect(html).toContain('Related Tools');
    expect(html).toContain('Frequently Asked Questions');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"FAQPage"');
  });

  it('renders required static pages cleanly on trailing-slash paths', () => {
    expect(render('/about/')).toContain('About AHADEX Tools');
    expect(render('/contact/')).toContain('Contact Us');
    expect(render('/privacy-policy/')).toContain('Privacy Policy');
    expect(render('/terms/')).toContain('Terms of Service');
  });
});
