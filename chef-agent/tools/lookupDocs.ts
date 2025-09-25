import { z } from 'zod';
import type { Tool } from 'ai';
import { resendComponentReadmePrompt } from '../prompts/components/resend.js';
import { presenceComponentReadmePrompt } from '../prompts/components/presence.js';

export const lookupDocsParameters = z.object({
  docs: z
    .array(z.string())
    .describe(
      'List of features to look up in the documentation. You should look up all the docs for the features you are implementing.',
    ),
});

export function lookupDocsTool(): Tool {
  return {
    description: `Lookup documentation for a list of features. Valid features to lookup are: \`proseMirror\` and \`presence\``,
    parameters: lookupDocsParameters,
  };
}

export type LookupDocsParameters = z.infer<typeof lookupDocsParameters>;

// Documentation content that can be looked up
export const docs = {
  presence: presenceComponentReadmePrompt,
  resend: resendComponentReadmePrompt,
} as const;

export type DocKey = keyof typeof docs;
