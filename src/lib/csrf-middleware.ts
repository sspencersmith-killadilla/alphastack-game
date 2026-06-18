import { createMiddleware } from "@tanstack/react-start";

type MiddlewareContext = {
  request: Request;
  handlerType?: string;
  next: () => Promise<unknown> | unknown;
};

type Matcher<TValue extends string> =
  | TValue
  | TValue[]
  | ((value: TValue | (string & {}), ctx: MiddlewareContext) => boolean | Promise<boolean>);

type CsrfOptions = {
  filter?: (ctx: MiddlewareContext) => boolean | Promise<boolean>;
  origin?: Matcher<string>;
  secFetchSite?: Matcher<"same-origin" | "same-site" | "cross-site" | "none">;
  referer?: boolean | ((referer: string, ctx: MiddlewareContext) => boolean | Promise<boolean>);
  allowRequestsWithoutOriginCheck?: boolean;
  failureResponse?: Response | ((ctx: MiddlewareContext) => Response | Promise<Response>);
};

const csrfSymbol = Symbol.for("tanstack-start:csrf-middleware");

export function createSafeCsrfMiddleware(opts: CsrfOptions = {}) {
  const middleware = createMiddleware().server(async (ctx) => {
    const csrfCtx = ctx as MiddlewareContext;

    if (opts.filter && !(await opts.filter(csrfCtx))) {
      return csrfCtx.next();
    }

    if (await isRequestAllowed(opts, csrfCtx)) {
      return csrfCtx.next();
    }

    if (typeof opts.failureResponse === "function") {
      return opts.failureResponse(csrfCtx);
    }

    return opts.failureResponse?.clone() ?? new Response("Forbidden", { status: 403 });
  });

  Object.defineProperty(middleware, csrfSymbol, { value: true });
  return middleware;
}

async function isRequestAllowed(opts: CsrfOptions, ctx: MiddlewareContext) {
  const result = await getValidationResult(opts, ctx);
  return result === true || (result === undefined && opts.allowRequestsWithoutOriginCheck === true);
}

async function getValidationResult(opts: CsrfOptions, ctx: MiddlewareContext) {
  const fetchSite = ctx.request.headers.get("Sec-Fetch-Site");
  if (fetchSite !== null) {
    return matchValue(opts.secFetchSite ?? "same-origin", fetchSite, ctx);
  }

  const origin = ctx.request.headers.get("Origin");
  if (origin !== null) {
    return opts.origin ? matchValue(opts.origin, origin, ctx) : origin === new URL(ctx.request.url).origin;
  }

  const referer = ctx.request.headers.get("Referer");
  if (referer === null || opts.referer === false) return undefined;

  if (typeof opts.referer === "function") return opts.referer(referer, ctx);

  if (opts.origin) {
    const refererOrigin = getOriginFromUrl(referer);
    return refererOrigin !== undefined && matchValue(opts.origin, refererOrigin, ctx);
  }

  return isRefererSameOrigin(referer, new URL(ctx.request.url).origin);
}

async function matchValue<TValue extends string>(
  matcher: Matcher<TValue>,
  value: string,
  ctx: MiddlewareContext,
) {
  if (typeof matcher === "function") return matcher(value, ctx);
  if (Array.isArray(matcher)) return matcher.includes(value as TValue);
  return value === matcher;
}

function getOriginFromUrl(url: string) {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isRefererSameOrigin(referer: string, requestOrigin: string) {
  if (referer === requestOrigin) return true;
  if (!referer.startsWith(requestOrigin)) return false;
  const code = referer.charCodeAt(requestOrigin.length);
  return code === 47 || code === 63 || code === 35;
}