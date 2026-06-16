interface CookieOptions {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
}

/**
 * Sets a cookie in the browser with security configurations.
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.expires) {
    if (typeof options.expires === "number") {
      const date = new Date();
      date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    } else {
      cookieString += `; expires=${options.expires.toUTCString()}`;
    }
  }

  cookieString += `; path=${options.path || "/"}`;

  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }

  // Secure: only transmit cookies over secure HTTPS protocol
  const isSecure =
    options.secure !== undefined
      ? options.secure
      : window.location.protocol === "https:";
  if (isSecure) {
    cookieString += "; secure";
  }

  // SameSite: Strict prevents the cookie from being sent on cross-site requests
  cookieString += `; samesite=${options.sameSite || "Strict"}`;

  document.cookie = cookieString;
}

/**
 * Gets a cookie value by name.
 */
export function getCookie(name: string): string | undefined {
  const matches = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1")}=([^;]*)`,
    ),
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

/**
 * Deletes a cookie by setting its expiration to the past.
 */
export function deleteCookie(
  name: string,
  options: { path?: string; domain?: string } = {},
): void {
  setCookie(name, "", {
    expires: -1,
    path: options.path,
    domain: options.domain,
  });
}
