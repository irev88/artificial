// Also accept credentials saved by the previous, header-based client.
export const isSessionToken = (value) =>
  typeof value === "string" && /^[A-Za-z0-9_-]{24,100}$/.test(value);
