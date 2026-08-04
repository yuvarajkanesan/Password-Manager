import { NativeModules } from 'react-native';

const { SecurityCheck } = NativeModules;

// Deterrent, not a hard boundary — see SecurityModule.kt for what these actually check.
export async function isDeviceRooted(): Promise<boolean> {
  try {
    return await SecurityCheck.isDeviceRooted();
  } catch {
    return false;
  }
}

// Always resolves false in debug builds (see native side) so this never blocks development.
export async function isDebuggingEnabled(): Promise<boolean> {
  try {
    return await SecurityCheck.isDebuggingEnabled();
  } catch {
    return false;
  }
}
