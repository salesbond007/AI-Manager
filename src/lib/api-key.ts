import { randomBytes, createHash } from "crypto";

const KEY_PREFIX = "aimgr";

export function generateApiKey() {
  const raw = randomBytes(24).toString("base64url");
  const plain = `${KEY_PREFIX}_${raw}`;
  return { plain, hash: hashApiKey(plain) };
}

export function hashApiKey(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}
