import packageJson from '../../package.json';

export interface VersionInfo {
  version: string;
  buildTime: string;
  gitCommit: string;
  environment: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: packageJson.version,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    gitCommit: process.env.NEXT_PUBLIC_GIT_COMMIT || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  };
}

export function getShortCommit(commit: string): string {
  return commit.substring(0, 7);
}

export function formatBuildTime(buildTime: string): string {
  try {
    return new Date(buildTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return buildTime;
  }
}
