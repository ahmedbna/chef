import type { Tool } from 'ai';
import { z } from 'zod';

export const npmInstallToolDescription = `
  Install additional dependencies for the Expo React Native project with NPM.
  
  Choose Expo React Native compatible libraries. Prefer:
  - Expo SDK modules when available
  - React Native community packages
  - Libraries with explicit React Native support
  Always verify Expo compatibility before installation.
  `;

const packagesDescription = `
  Space separated list of NPM packages to install. This will be passed directly to \`npx expo install\`.
`;

export const npmInstallToolParameters = z.object({
  packages: z.string().describe(packagesDescription),
});

export const npmInstallTool: Tool = {
  description: npmInstallToolDescription,
  parameters: npmInstallToolParameters,
};
