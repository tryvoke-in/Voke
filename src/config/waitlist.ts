export const WAITLIST_CONFIG = {
  enabled: false,
  bypassCode: "vokedev", // Secret key to bypass waitlist: ?bypass=vokedev or logo gesture
  publicPaths: ["/", "/waitlist", "/privacy", "/help", "/blogs", "/blog"],
};

export const isPublicPath = (pathname: string): boolean => {
  if (WAITLIST_CONFIG.publicPaths.includes(pathname)) {
    return true;
  }
  // Allow sub-paths under blogs/blog, such as /blog/:id
  if (pathname.startsWith("/blog/")) {
    return true;
  }
  return false;
};
