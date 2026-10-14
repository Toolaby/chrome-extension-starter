// Types for toolaby.manifest.js, so a TypeScript config can spread it.
export declare const site: string;
export declare const manifest: { key?: string; permissions: string[]; externally_connectable: { matches: string[] } };
export declare const unneededHost: string;
/** A content security policy with Toolaby's address in connect-src; one that already allows it comes back as it is. */
export declare function cspWithToolaby(policy: string): string;
