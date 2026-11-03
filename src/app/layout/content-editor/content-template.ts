import { Portfolio } from '@data/portfolio.data';

/**
 * A fill-in template of the site's content: a short field guide followed by
 * the current content as JSON. Edit the values, paste it all back into the
 * editor, and the importer picks out the JSON part.
 */
export function buildContentTemplate(current: Portfolio): string {
  return `PORTFOLIO CONTENT TEMPLATE
Edit the values in the JSON below, keep the structure, then paste everything back
into the editor (Import & export tab) and press Apply. Unknown fields can stay "" or [].

Field guide
  name / initials      full name, and 1-3 letters for the logo
  role / tagline       job title, and one short sentence about you
  location / email     "City, Country", contact email
  resumeUrl            public link to a PDF, or ""
  about                2-3 short paragraphs
  facts                3 quick facts, each a label and a value (Based in: Delhi, India)
  skills               groups (Frontend, Design, ...) with items; level is 0-100
  projects             title, year, tagline, description, tech, links (full https:// URLs),
                       slot 0-5 picks the colour accent
  experience           newest first, education included
  socials              GitHub, LinkedIn, ... with full https:// URLs

${JSON.stringify(current, null, 2)}
`;
}
