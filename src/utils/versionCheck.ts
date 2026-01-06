/**
 * Version check utility to detect when a new version is deployed
 * and prompt users to refresh their browser
 */

interface VersionInfo {
  version: string;
  buildTime: string;
  buildTimestamp: string;
}

/**
 * Get the current build version from meta tags
 */
export function getCurrentVersion(): VersionInfo | null {
  const versionMeta = document.querySelector('meta[name="app-version"]');
  const buildTimeMeta = document.querySelector('meta[name="build-time"]');
  const buildTimestampMeta = document.querySelector('meta[name="build-timestamp"]');

  if (!versionMeta || !buildTimeMeta || !buildTimestampMeta) {
    return null;
  }

  return {
    version: versionMeta.getAttribute('content') || '',
    buildTime: buildTimeMeta.getAttribute('content') || '',
    buildTimestamp: buildTimestampMeta.getAttribute('content') || '',
  };
}

/**
 * Check if a new version is available by comparing build times
 */
export function checkForUpdates(): boolean {
  const currentVersion = getCurrentVersion();
  if (!currentVersion) {
    return false;
  }

  const storedBuildTime = localStorage.getItem('app-build-time');
  const currentBuildTime = currentVersion.buildTime;

  if (!storedBuildTime) {
    // First time visit, store the current build time
    localStorage.setItem('app-build-time', currentBuildTime);
    return false;
  }

  // If build times don't match, a new version is available
  if (storedBuildTime !== currentBuildTime) {
    return true;
  }

  return false;
}

/**
 * Update the stored build time (call this after user refreshes)
 */
export function updateStoredVersion(): void {
  const currentVersion = getCurrentVersion();
  if (currentVersion) {
    localStorage.setItem('app-build-time', currentVersion.buildTime);
  }
}

/**
 * Initialize version checking
 * Call this in your app initialization
 * @param checkInterval - How often to check for updates in milliseconds
 * @param onUpdateAvailable - Callback when update is detected
 */
export function initVersionCheck(
  checkInterval: number,
  onUpdateAvailable?: () => void
): () => void {
  // Check immediately
  if (checkForUpdates()) {
    onUpdateAvailable?.();
  }

  // Set up periodic checking
  const intervalId = setInterval(() => {
    if (checkForUpdates()) {
      onUpdateAvailable?.();
      clearInterval(intervalId);
    }
  }, checkInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

