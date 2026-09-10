import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { isRefreshResponseForCurrentSession } from "../utils/authSessionRace";

const projectRoot = process.cwd();
const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.resolve(projectRoot, relativePath), "utf8");

test("a stale in-flight refresh cannot overwrite a password-rotated session", () => {
  assert.equal(
    isRefreshResponseForCurrentSession("old-refresh", "new-password-refresh"),
    false,
  );
  assert.equal(
    isRefreshResponseForCurrentSession("current-refresh", "current-refresh"),
    true,
  );
  assert.equal(isRefreshResponseForCurrentSession("old-refresh", null), false);
});

test("password change installs the typed token pair before returning success", () => {
  const hookSource = readProjectFile("hooks/UserHooks/useAccountDetails.ts");
  const screenSource = readProjectFile("app/settings/accountdetails.tsx");

  assert.match(
    hookSource,
    /type ChangePasswordResponse = \{\s*message: string;\s*accessToken: string;\s*refreshToken: string;/s,
  );
  assert.match(
    hookSource,
    /apiClient\.patch<ChangePasswordResponse>[\s\S]*await saveTokens\(\s*response\.data\.accessToken,\s*response\.data\.refreshToken/s,
  );

  const changePasswordIndex = screenSource.indexOf("await changePassword(");
  const resetIndex = screenSource.indexOf("reset();", changePasswordIndex);
  const successIndex = screenSource.indexOf('Alert.alert("Success"', resetIndex);

  assert.ok(changePasswordIndex >= 0);
  assert.ok(resetIndex > changePasswordIndex);
  assert.ok(successIndex > resetIndex);
});

test("authenticated requests read the newly stored access token on every call", () => {
  const clientSource = readProjectFile("utils/apiClient.ts");

  assert.match(
    clientSource,
    /interceptors\.request\.use\(async \(config\) => \{\s*const token = await getAccessToken\(\)/s,
  );
  assert.match(clientSource, /AsyncStorage\.multiSet\(\[/);
  assert.match(clientSource, /notifyAuthSessionListeners\(accessToken\)/);
});
