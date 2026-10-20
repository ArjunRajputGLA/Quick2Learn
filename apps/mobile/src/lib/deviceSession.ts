import * as SecureStore from "expo-secure-store";
import { ACTIVE_USER_STORAGE_KEY } from "../api/hooks";

export const DEVICE_ID_STORAGE_KEY = "q2l_device_id";
export const DEVICE_ACTIVE_ROLE_KEY = "q2l_device_active_role";
export const CODE_CLAIMS_STORAGE_KEY = "q2l_child_code_claims";
export const BOUND_CODES_STORAGE_KEY = "q2l_active_parent_bound_codes";

export interface ChildCodeClaim {
  code: string;
  deviceId: string;
  parentUserId: string;
  parentName?: string;
  claimedAt: string;
  active: boolean;
}

/**
 * Returns a persistent unique identifier for this device.
 * Generates and saves a new UUID-like identifier if not already present.
 */
export async function getDeviceId(): Promise<string> {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
    if (!id) {
      id = `dev-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      await SecureStore.setItemAsync(DEVICE_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "dev-local-device";
  }
}

/**
 * Returns the currently active role on this device ('student' | 'parent' | 'teacher' | 'admin' | null).
 */
export async function getDeviceActiveRole(): Promise<string | null> {
  try {
    const explicitRole = await SecureStore.getItemAsync(DEVICE_ACTIVE_ROLE_KEY);
    if (explicitRole) {
      return explicitRole;
    }
    const activeUserJson = await SecureStore.getItemAsync(ACTIVE_USER_STORAGE_KEY);
    if (activeUserJson) {
      const parsed = JSON.parse(activeUserJson);
      if (parsed?.role) {
        await SecureStore.setItemAsync(DEVICE_ACTIVE_ROLE_KEY, parsed.role).catch(() => {});
        return parsed.role;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sets the active portal role on this device.
 */
export async function setDeviceActiveRole(role: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(DEVICE_ACTIVE_ROLE_KEY, role);
  } catch (err) {
    console.warn("[deviceSession] Error setting active role:", err);
  }
}

/**
 * Checks mutual exclusivity between Student and Parent portals on the same device.
 * A device logged in with Student portal cannot log in as Parent without logging out, and vice versa.
 */
export async function checkDeviceRoleMutualExclusion(targetRole: string): Promise<{
  allowed: boolean;
  message?: string;
}> {
  const currentRole = await getDeviceActiveRole();

  if (!currentRole) {
    return { allowed: true };
  }

  // Student device cannot log into parent portal
  if (currentRole === "student" && targetRole === "parent") {
    return {
      allowed: false,
      message:
        "This device currently has a Student Portal logged in. Quick2Learn does not permit Parent Portal login on a device with an active Student session. Please log out from the Student Portal first.",
    };
  }

  // Parent device cannot log into student portal
  if (currentRole === "parent" && targetRole === "student") {
    return {
      allowed: false,
      message:
        "This device currently has a Parent Portal logged in. Quick2Learn does not permit Student Portal login on a device with an active Parent session. Please log out from the Parent Portal first.",
    };
  }

  return { allowed: true };
}

/**
 * Retrieves all registered child code claims.
 */
export async function getAllChildCodeClaims(): Promise<Record<string, ChildCodeClaim>> {
  try {
    const json = await SecureStore.getItemAsync(CODE_CLAIMS_STORAGE_KEY);
    if (json) {
      return JSON.parse(json);
    }
  } catch {}
  return {};
}

/**
 * Verifies whether a child invite code can be claimed on this device.
 * Enforces: If a code is put into one device, it CANNOT be logged in into another parent device
 * without logging out from the first parent device.
 */
export async function verifyChildCodeDeviceClaim(
  rawCode: string,
  currentParentUserId?: string
): Promise<{ allowed: boolean; error?: string }> {
  const code = rawCode.trim().toUpperCase();
  const currentDeviceId = await getDeviceId();
  const claims = await getAllChildCodeClaims();

  const existingClaim = claims[code];
  if (!existingClaim || !existingClaim.active) {
    // Code is available to be claimed
    return { allowed: true };
  }

  // If claimed by another device and still active
  if (existingClaim.deviceId !== currentDeviceId) {
    return {
      allowed: false,
      error: `This child invite code [${code}] is already active on another parent device. It cannot be used on this device without logging out from the first parent device first.`,
    };
  }

  // If on this device, check if claimed by another parent user account without logging out
  if (
    currentParentUserId &&
    existingClaim.parentUserId &&
    existingClaim.parentUserId !== currentParentUserId
  ) {
    return {
      allowed: false,
      error: `This child invite code [${code}] is already active for another parent account (${existingClaim.parentName || "Parent"}). Please log out first.`,
    };
  }

  return { allowed: true };
}

/**
 * Binds a child invite code to the current device and parent account.
 */
export async function claimChildCodeOnDevice(
  rawCode: string,
  parentUserId: string,
  parentName?: string
): Promise<void> {
  const code = rawCode.trim().toUpperCase();
  const currentDeviceId = await getDeviceId();
  const claims = await getAllChildCodeClaims();

  claims[code] = {
    code,
    deviceId: currentDeviceId,
    parentUserId,
    parentName,
    claimedAt: new Date().toISOString(),
    active: true,
  };

  try {
    await SecureStore.setItemAsync(CODE_CLAIMS_STORAGE_KEY, JSON.stringify(claims));

    // Also record on local active list
    const boundJson = await SecureStore.getItemAsync(BOUND_CODES_STORAGE_KEY).catch(() => null);
    let boundCodes: string[] = [];
    if (boundJson) {
      try {
        boundCodes = JSON.parse(boundJson);
      } catch {}
    }
    if (!boundCodes.includes(code)) {
      boundCodes.push(code);
      await SecureStore.setItemAsync(BOUND_CODES_STORAGE_KEY, JSON.stringify(boundCodes));
    }
  } catch (err) {
    console.warn("[deviceSession] Error claiming child code:", err);
  }
}

/**
 * Releases child invite code claims held by this device and/or parent account.
 * Called during logout so other parent devices can now bind the child code.
 */
export async function releaseChildCodesOnDevice(parentUserId?: string): Promise<void> {
  try {
    const currentDeviceId = await getDeviceId();
    const claims = await getAllChildCodeClaims();
    let updated = false;

    for (const key of Object.keys(claims)) {
      const claim = claims[key];
      if (
        claim &&
        claim.active &&
        (claim.deviceId === currentDeviceId || (parentUserId && claim.parentUserId === parentUserId))
      ) {
        claim.active = false;
        updated = true;
      }
    }

    if (updated) {
      await SecureStore.setItemAsync(CODE_CLAIMS_STORAGE_KEY, JSON.stringify(claims));
    }

    await SecureStore.deleteItemAsync(BOUND_CODES_STORAGE_KEY).catch(() => {});
  } catch (err) {
    console.warn("[deviceSession] Error releasing child codes:", err);
  }
}

/**
 * Clears the active device session on logout.
 */
export async function clearDeviceActiveSession(parentUserId?: string): Promise<void> {
  try {
    await releaseChildCodesOnDevice(parentUserId);
    await SecureStore.deleteItemAsync(DEVICE_ACTIVE_ROLE_KEY).catch(() => {});
  } catch (err) {
    console.warn("[deviceSession] Error clearing active session:", err);
  }
}
