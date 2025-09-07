import { execSync } from 'child_process';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_GIT_COMMIT: (() => {
      try {
        return execSync('git rev-parse HEAD').toString().trim();
      } catch (error) {
        console.warn('Unable to get git commit hash:', error.message);
        return 'unknown';
      }
    })()
  }
};

export default nextConfig;
