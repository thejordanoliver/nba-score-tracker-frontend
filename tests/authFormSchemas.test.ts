import assert from "node:assert/strict";
import test from "node:test";

import { changePasswordSchema } from "../schemas/auth/changePasswordSchema";
import { forgotPasswordSchema } from "../schemas/auth/forgotPasswordSchema";
import { signupSchema } from "../schemas/auth/signupSchema";

const validSignup = {
  fullName: "Tempo Fan",
  username: "tempo.fan",
  email: "fan@example.com",
  password: "password123",
  confirmPassword: "password123",
  favoriteTeams: ["nba:1"],
  favoriteSports: ["nba"],
  profileImage: null,
  bannerImage: null,
};

test("signup schema normalizes submitted identity fields", () => {
  const result = signupSchema.parse({
    ...validSignup,
    fullName: "  Tempo Fan  ",
    username: "  TEMPO.FAN  ",
    email: "  FAN@EXAMPLE.COM  ",
  });

  assert.equal(result.fullName, "Tempo Fan");
  assert.equal(result.username, "tempo.fan");
  assert.equal(result.email, "fan@example.com");
});

test("signup schema enforces backend limits and matching passwords", () => {
  const result = signupSchema.safeParse({
    ...validSignup,
    username: "no spaces allowed",
    password: "short",
    confirmPassword: "different",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path[0]);

    assert.ok(paths.includes("username"));
    assert.ok(paths.includes("password"));
    assert.ok(paths.includes("confirmPassword"));
  }
});

test("forgot-password schema validates and normalizes the recovery payload", () => {
  const result = forgotPasswordSchema.parse({
    email: "  FAN@EXAMPLE.COM ",
    code: " 123456 ",
    password: "new-password",
    confirmPassword: "new-password",
  });

  assert.equal(result.email, "fan@example.com");
  assert.equal(result.code, "123456");
});

test("forgot-password schema rejects malformed codes and password mismatch", () => {
  const result = forgotPasswordSchema.safeParse({
    email: "fan@example.com",
    code: "12345",
    password: "new-password",
    confirmPassword: "different-password",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    const paths = result.error.issues.map((issue) => issue.path[0]);

    assert.ok(paths.includes("code"));
    assert.ok(paths.includes("confirmPassword"));
  }
});

const validPasswordChange = {
  currentPassword: "current-password",
  newPassword: "new-password",
  confirmPassword: "new-password",
};

test("change-password schema accepts backend-compatible values", () => {
  assert.deepEqual(changePasswordSchema.parse(validPasswordChange), {
    currentPassword: "current-password",
    newPassword: "new-password",
    confirmPassword: "new-password",
  });
});

test("change-password schema rejects a short new password", () => {
  const result = changePasswordSchema.safeParse({
    ...validPasswordChange,
    newPassword: "short",
    confirmPassword: "short",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(
      result.error.issues.some((issue) => issue.path[0] === "newPassword"),
    );
  }
});

test("change-password schema rejects a password confirmation mismatch", () => {
  const result = changePasswordSchema.safeParse({
    ...validPasswordChange,
    confirmPassword: "different-password",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(
      result.error.issues.some(
        (issue) => issue.path[0] === "confirmPassword",
      ),
    );
  }
});

test("change-password schema requires the current password", () => {
  const result = changePasswordSchema.safeParse({
    ...validPasswordChange,
    currentPassword: "",
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(
      result.error.issues.some(
        (issue) => issue.path[0] === "currentPassword",
      ),
    );
  }
});

test("change-password schema requires a different new password", () => {
  const result = changePasswordSchema.safeParse({
    ...validPasswordChange,
    newPassword: validPasswordChange.currentPassword,
    confirmPassword: validPasswordChange.currentPassword,
  });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(
      result.error.issues.some((issue) => issue.path[0] === "newPassword"),
    );
  }
});
