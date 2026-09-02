import { randomBytes } from "crypto";

export function generateInviteToken() {
  return randomBytes(32).toString("base64url");
}
