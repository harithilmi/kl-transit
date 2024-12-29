/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i8n/request.ts');

/** @type {import("next").NextConfig} */
/** @type {import("next").NextConfig} */
const config = {
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	reactStrictMode: false,
	images: {
		domains: ['api.mapbox.com'],
	},
};

export default withNextIntl(config);
