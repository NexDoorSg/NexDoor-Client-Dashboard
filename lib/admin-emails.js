export const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "bjornlimdongxian@gmail.com",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
].map((email) => email.toLowerCase());

export function isAdminEmail(email = "") {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
