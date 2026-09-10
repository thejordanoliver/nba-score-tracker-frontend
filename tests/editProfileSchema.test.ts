import assert from "node:assert/strict";
import test from "node:test";

import {
  EDIT_PROFILE_BIO_MAX_LENGTH,
  EDIT_PROFILE_FULL_NAME_MAX_LENGTH,
  editProfileSchema,
} from "../schemas/user/editProfileSchema";

test("edit-profile schema accepts and trims valid submitted values", () => {
  assert.deepEqual(
    editProfileSchema.parse({
      fullName: "  Tempo Fan  ",
      bio: "  Sports all day.  ",
    }),
    {
      fullName: "Tempo Fan",
      bio: "Sports all day.",
    },
  );
});

test("edit-profile schema accepts an empty optional bio", () => {
  assert.deepEqual(
    editProfileSchema.parse({ fullName: "Tempo Fan", bio: "" }),
    { fullName: "Tempo Fan", bio: "" },
  );
});

test("edit-profile schema requires a non-empty full name after trimming", () => {
  const result = editProfileSchema.safeParse({ fullName: "   ", bio: "" });

  assert.equal(result.success, false);

  if (!result.success) {
    assert.ok(result.error.issues.some((issue) => issue.path[0] === "fullName"));
  }
});

test("edit-profile schema enforces the backend full-name maximum", () => {
  assert.equal(
    editProfileSchema.safeParse({
      fullName: "a".repeat(EDIT_PROFILE_FULL_NAME_MAX_LENGTH),
      bio: "",
    }).success,
    true,
  );
  assert.equal(
    editProfileSchema.safeParse({
      fullName: "a".repeat(EDIT_PROFILE_FULL_NAME_MAX_LENGTH + 1),
      bio: "",
    }).success,
    false,
  );
});

test("edit-profile schema enforces the backend bio maximum before trimming", () => {
  assert.equal(
    editProfileSchema.safeParse({
      fullName: "Tempo Fan",
      bio: "a".repeat(EDIT_PROFILE_BIO_MAX_LENGTH),
    }).success,
    true,
  );
  assert.equal(
    editProfileSchema.safeParse({
      fullName: "Tempo Fan",
      bio: `${"a".repeat(EDIT_PROFILE_BIO_MAX_LENGTH)} `,
    }).success,
    false,
  );
});
