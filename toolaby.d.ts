// Types for toolaby.js — the platform client, configured for this tool.
// Beside toolaby.js so that `import { toolaby } from './toolaby.js'` is
// typed in a TypeScript background or page, with nothing to install.
//
// The reference, with what each call does and when it goes to the
// request: /docs/reference/client on your workspace's address.

/** What the Free plan holds — set under Pricing → Access, read by every device at its next check. `open` is the tool's
 * use: a feature a plan sells is refused all the same. Whether an account is needed at all is `User.signInRequired`. */
export type Access = 'open' | 'free_uses' | 'paid';

/** The answer to gate(): may this device do one (or `count`) of the thing, now? */
export type Permit =
  | {
      allowed: true;
      /** A paid plan, a trial or a grant is behind it; false when a free use was spent. */
      isPremium: boolean;
      /** The Free plan is not counting (open, sign-in only, or paid). */
      unlimited?: boolean;
      /** Free uses: after this one. */
      remaining?: number | null;
      limit?: number;
      used?: number;
      /** Free uses that start again each day, week or month (UTC): the period, and when more come. Absent when they are counted for good, and offline. */
      per?: 'day' | 'week' | 'month';
      resetsAt?: Date;
      /** Answered from the device's own record; the platform was unreachable. */
      offline?: boolean;
      /** The account holds a plan, but this device is past its device limit: the answer is the Free plan's. */
      deviceLimit?: { allowed: number; held: number | null };
      /** Free uses counted with every throwaway or unverified address of the tool: they share one count, as they have no trial. */
      sharedUses?: true;
    }
  | {
      allowed: false;
      /** Why not: an account first, a paid plan first, the free uses spent, or a feature the plan does not hold. */
      reason: 'sign_in' | 'paid' | 'limit' | 'feature';
      isPremium?: boolean;
      /** For 'feature' (and 'paid' asked about a feature): the feature asked for, and the ids of the plans that sell it. */
      feature?: string;
      needs?: string[];
      /** For 'limit'. With free uses a day, week or month (UTC): the period, and when more come — not in a refusal given offline. */
      remaining?: number;
      limit?: number;
      per?: 'day' | 'week' | 'month';
      resetsAt?: Date;
      /** The platform could not be reached. With `unknown`, the device has never heard what the Free plan holds (a first open, offline): nothing is given on a guess. */
      offline?: boolean;
      unknown?: boolean;
      /** The account holds a plan, but this device is past its device limit: showPaywall() says so, not the plans. */
      deviceLimit?: { allowed: number; held: number | null };
      /** Free uses counted with every throwaway or unverified address of the tool: they share one count, as they have no trial. */
      sharedUses?: true;
    }
  | {
      allowed: false;
      /** This build is below the minimum version set under Versions. Show `message` and stop. */
      blocked: true;
      message: string | null;
    };

/** A plan as the dashboard defines it, as the buyer holds it. */
export type Plan = {
  id: string;
  name: string;
  billing: 'one_time' | 'subscription';
  amountCents: number | null;
  currency: string | null;
  interval: 'month' | 'year' | null;
};

/** A plan the tool sells, as getPlans() lists it: the tier it belongs to and its free trial beside the price. */
export type ToolPlan = Plan & { tier: string | null; trialDays: number };

/** What the device knows about the person: getUser() answers it with no network, refresh() after asking the platform. */
export type User = {
  /** Holds the tool by any means below. */
  paid: boolean;
  /** How: a subscription, a lifetime licence, a trial, a grant; `account` while the means is not yet known; null when unpaid. */
  via: 'subscription' | 'licence' | 'trial' | 'grant' | 'account' | 'unknown' | null;
  /** The signed-in account's address, or the licence's; null when neither. */
  email: string | null;
  paidAt: Date | null;
  plan: Plan | null;
  subscription: { status: string; periodEnd: Date | null; cancelAtPeriodEnd: boolean; cancelAt: Date | null } | null;
  trial: { endsAt: Date | null; active: boolean } | null;
  /** Held by the account, but this device is past its plan's device limit: the Free plan here until another is signed out. */
  deviceLimit: { allowed: number; held: number | null } | null;
  /** The account signed in on this device, if any. */
  /** The account signed in on this device: its address; the name and picture it carries (a provider's, when they signed in with one), from the server's last word. */
  account: { linked: boolean; email: string | null; name: string | null; image: string | null; linkedAt: string | null };
  /** A licence key was activated on this device (the older way in; sign-in is the usual one). */
  licenseKey: { present: boolean };
  /** The entitlement token's dates: when it was issued, when it expires, until when it is honoured offline; and the plan it was signed for, while it verifies (null for a trial or a grant). */
  token: { issuedAt: number | null; expiresAt: number | null; offlineUntil: number | null; plan: string | null } | null;
  /** What the Free plan holds. */
  access: Access;
  /** Whether using the tool needs an account at all: signed out, gate() refuses with 'sign_in' whatever the Free plan holds. */
  signInRequired: boolean;
  /** The feature keys this device holds; null for everything (no catalogue, or an entitlement with no list). */
  features: string[] | null;
  /**
   * The free uses on this device, or the signed-in account's where the tool requires one: `limit` is what you set,
   * `remaining` null when not counting. `per`: 'ever' when they are counted for good; 'day', 'week' or 'month' when they
   * start again (UTC), with `resetsAt`, when more come.
   */
  usage: { unlimited: boolean; used: number; limit: number; remaining: number | null; per: 'ever' | 'day' | 'week' | 'month'; resetsAt?: Date };
  version: VersionState;
  installedAt: Date | null;
  /** The device's id, as the buyer's account lists it. */
  installId: string | null;
  /** The tool's billing as configured: 'one_time' or 'subscription'. */
  billing: string;
  /** The tool's id. */
  tool: string;
};

/** The version check: whether it has run, and whether this build may run. */
export type VersionState = { checked: boolean; blocked: boolean; reason: string | null; message: string | null };

/** What startBackground() takes: your own message handlers, behind the gate where they should be. */
export type BackgroundOptions = {
  /** `{ action }` messages from your popup and content scripts, by action name. */
  handlers?: Record<string, (message: any, sender: chrome.runtime.MessageSender) => unknown>;
  /** Messages from web pages (externally_connectable), by action name. */
  externalHandlers?: Record<string, (message: any, sender: chrome.runtime.MessageSender) => unknown>;
  /** false: stay silent for actions you do not handle, so another listener of yours can answer. Default true. */
  claimUnknown?: boolean;
  /** Startup checks to skip, by name. */
  skip?: string[];
  /** true: your content scripts may read and write chrome.storage.local. By default only the extension's pages and its background can: the account link and the licence key are kept there. Default false. */
  contentScriptStorage?: boolean;
  /** true: your content scripts may ask for the account's actions — activateLicense, signOut, resendLicense, listActivations, deactivate, capability. By default only the extension's own pages may: a content script runs in the web page's process. Reading and gate() are open to both. Default false. */
  contentScriptActions?: boolean;
};

export type Listener = (user: User) => void;
export type Event = { addListener(cb: Listener): void; removeListener(cb: Listener): void };

export interface Toolaby {
  /** In the service worker, once: the message listeners, the site's handoffs, the version check. Throws elsewhere. */
  startBackground(options?: BackgroundOptions): void;
  /** startBackground() unless something already called it — what a build tool's hook calls, so your own call with handlers wins. */
  ensureBackground(): void;
  /** What the device knows now. No network. */
  getUser(): Promise<User>;
  /** The plans the tool sells, in the order the dashboard shows them. Asks the platform at most once a minute. */
  getPlans(): Promise<ToolPlan[]>;
  /** Asks the platform and answers. When the popup opens; not on every action. */
  refresh(): Promise<User>;
  /** May this device do the thing, now? Spends a free use when it says yes to one. Network only to count that use, or to ask about a feature the plan does not hold; otherwise answered on the device. */
  gate(arg?: number | { count?: number; feature?: string }): Promise<Permit>;
  /** Does this device hold the feature? A free one always; otherwise the plan's. No network. */
  has(feature: string): Promise<boolean>;
  /** Forgets the account and the entitlement on this device. The account itself is untouched. */
  signOut(): Promise<void>;
  /** The version check's last answer; `fresh` asks again (on Live, when the answer is five minutes old). */
  versionState(options?: { fresh?: boolean }): Promise<VersionState>;
  /** Opens the buyer page on your workspace's address, a plan preselected if named. */
  openPaymentPage(planId?: string): Promise<void>;
  /** Opens sign-in on your workspace's address; signed in, the page hands the session back to the extension. */
  openLoginPage(provider?: 'google'): Promise<void>;
  /** Opens the buyer's account page. */
  openAccountPage(): Promise<void>;
  /**
   * A refused permit, answered by Toolaby's panel. In your popup or side panel the page gives way to the panel for that
   * reason, which has a Back button and returns to the page by itself once the device may. `{ feature }` alone asks for a
   * feature's plans. A side panel says so with `<html data-toolaby-surface="sidepanel">`. From a page open in a tab, or a
   * content script, it opens the checkout (or sign-in) page in a new tab instead. Throws in the background.
   */
  showPaywall(permit: Permit | { feature: string; needs?: string[] }): Promise<void>;
  /** Background only: the device went from unpaid to paid — a purchase, a sign-in that brought an entitlement. */
  onPaid: Event;
  /** Background only: every change of `paid`, either way. */
  onChange: Event;
}

export declare const toolaby: Toolaby;

// ── ExtensionPay's calls, answered by Toolaby ──────────────────────────────
// For an extension moving from ExtensionPay: `import { ExtPay } from './toolaby.js'` where `import ExtPay from 'extpay'`
// was, and the rest of its code as it is (toolaby.app/docs/extensionpay). The id it takes names nothing: the tool is
// this file's.

export type ExtPayPlan = { unitAmountCents: number; currency: string; nickname: string | null; interval: 'month' | 'year' | 'once'; intervalCount: number | null };
export type ExtPayUser = {
  paid: boolean;
  paidAt: Date | null;
  email: string | null;
  installedAt: Date;
  /** Toolaby runs the trial: now while it runs, a year before it ended once it has, so a seven-day check keeps answering. */
  trialStartedAt: Date | null;
  plan: ExtPayPlan | null;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
  subscriptionCancelAt?: Date | null;
};
export type ExtPayClient = {
  getUser: () => Promise<ExtPayUser>;
  getPlans: () => Promise<ExtPayPlan[]>;
  onPaid: { addListener: (cb: (user: ExtPayUser) => void) => void };
  /** A plan's nickname: its id, or the tier ExtensionPay's nickname was kept as. */
  openPaymentPage: (planNickname?: string) => Promise<void>;
  openLoginPage: () => Promise<void>;
  /** Opens the tool's page, where its free trial starts. */
  openTrialPage: (displayText?: string) => Promise<void>;
  onTrialStarted: { addListener: (cb: (user: ExtPayUser) => void) => void };
  startBackground: () => void;
};
export declare function ExtPay(extensionId?: string): ExtPayClient;

// ── The popup UI, in the same file ─────────────────────────────────────────
// The panel the platform draws (Toolaby's popup uses it; a popup of your
// own may): the paywall facts, the brand's tokens, and the renderers. All
// of it is drawn from what the platform sends — nothing here is yours to
// design; change Branding or Pricing in the dashboard.

/** A plan as the panel knows it: what plansWith() answers. The price is in the paywall's options, as the checkout page words it. */
export type PaywallPlan = { id: string; name: string; tier: string | null; features: string[] };
/** What the platform sends for the panel: the plans as the checkout page words them, the brand's tokens, the words. Opaque; hand it to the renderers. */
export type Paywall = { brand: { accent: string; accentFg: string; darkAccent: string; darkAccentFg: string; radiusPx: number; mode: 'light' | 'dark' | 'auto'; iconUrl: string | null } | null; words: Record<string, string>; [k: string]: unknown };
/** Why the device may not: which screen the panel draws. */
export type Refusal = { kind: 'sign_in'; bought?: boolean } | { kind: 'paid' } | { kind: 'limit' } | { kind: 'feature'; feature: string; needs: string[] | null } | { kind: 'past_due' } | { kind: 'device_limit'; allowed: number; held: number | null };
export type PanelActions = { buy: (planId: string) => void; signIn: () => void; account?: () => void };
/** The tool as the background resolved it (`{ action: 'toolaby.config' }`): what the renderers need. */
export type PanelConfig = { name: string; freeLimit?: number; slug?: string; siteUrl?: string };

/** The paywall facts for this tool, in the browser's language: cached for a day, fetched again when the platform's stamp says the brand or the pricing moved. */
export declare function loadPaywall(config: PanelConfig): Promise<Paywall | null>;
/** The brand's tokens onto the document. */
export declare function applyBrand(paywall: Paywall | null): void;
/** The panel's stylesheet onto the document, once — call first in a popup of your own that styles on the --pw-* tokens:
 * --pw-bg, --pw-frame, --pw-panel (grounds); --pw-line, --pw-line-soft (rules); --pw-ink, --pw-body, --pw-muted,
 * --pw-faint (text); --pw-on, --pw-on-fg (the brand's accent and the text on it); --pw-ok, --pw-ok-soft, --pw-warn,
 * --pw-warn-soft; --pw-r-frame, --pw-r-panel, --pw-r-ctl (radii); --pw-shadow, --pw-ease, --pw-font. Dark mode sets them all.
 * It sizes the page as a 336px popup unless <html> carries data-toolaby-surface="sidepanel", which makes it fill a side panel. */
export declare function ensureStyles(doc?: Document): void;
/** The header's mark: the extension's own icon from its manifest, else the initial. */
export declare function renderMark(node: HTMLElement, name: string): void;
/** Why the device may not, from the user and the permit that refused. */
export declare function refusalOf(user: User, permit: Permit | null): Refusal;
/** The panel for a device that is not unlocked. */
export declare function renderPaywall(root: HTMLElement, paywall: Paywall | null, user: User, config: PanelConfig, actions: PanelActions, refusal?: Refusal): void;
/** The panel once unlocked: the plan held, the account. */
export declare function renderUnlocked(root: HTMLElement, paywall: Paywall | null, user: User, config: PanelConfig, actions: PanelActions, opts?: { celebrate?: boolean }): void;
/** A notice in place of everything else. */
export declare function renderNotice(root: HTMLElement, title: string, body: string): void;
/** The plans that hold a feature, the ones `gate()` named first: what the panel offers when a feature is refused. */
export declare function plansWith(paywall: Paywall | null, feature: string, needs?: string[] | null): PaywallPlan[];
/** The account bar drawn into an element of your own, instead of the `<toolaby-account>` tag: who is signed in, their plan, their account, sign out. */
export declare function renderAccountBar(host: HTMLElement, paywall: Paywall | null, user: User, actions: PanelActions): void;
/** Defines `<toolaby-account>`. The bundle calls it as soon as it is on a page, so the tag is there already; this is for a page that imports nothing else. */
export declare function defineAccountBar(): void;
/** `<toolaby-account>`: the account bar. Attributes: `scheme` (`light` | `dark`), `data-dock`. It redraws when the device's account changes. */
export interface ToolabyAccountElement extends HTMLElement {
  /** Draws the bar again now, for a change it cannot see. */
  refresh(): void;
}
declare global { interface HTMLElementTagNameMap { 'toolaby-account': ToolabyAccountElement } }

/** Toolaby's popup page, mounted into toolaby-popup.html's shell. Hands over to `appPopup` when the device may. */
export declare function mountPopup(): void;
/** Toolaby's side panel — the same page, at the panel's width — mounted into toolaby-sidepanel.html's shell. Hands over to `appSidePanel`. */
export declare function mountSidePanel(): void;
