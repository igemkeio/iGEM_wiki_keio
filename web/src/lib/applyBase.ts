// 原稿htmlのroot相対URL(/で始まり//で始まらない)に、配信パスの接頭辞baseを付ける。
// notionBaseを渡すと、/notion-images/と/notion-files/で始まるURLにはbaseの代わりにnotionBaseを付ける。
const tagPattern = /<[a-zA-Z][a-zA-Z0-9-]*(?:"[^"]*"|'[^']*'|[^>"'])*>/gu;
const attrPattern =
  /(\s)(src|href|poster|srcset)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/giu;

const notionPattern = /^\/notion-(?:images|files)\//u;

function isRootRelative(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

function prefixFor(url: string, prefix: string, notion?: string): string {
  return notion !== undefined && notionPattern.test(url) ? notion : prefix;
}

// srcsetは候補を","で区切り、各候補の先頭がURL。URL自体の","は空白までを1語として扱う。
function prefixSrcset(value: string, prefix: string, notion?: string): string {
  return value.replaceAll(
    /(^|,)(\s*)(\S+)/gu,
    (whole, sep: string, space: string, url: string) => {
      if (isRootRelative(url)) {
        return `${sep}${space}${prefixFor(url, prefix, notion)}${url}`;
      }
      return whole;
    }
  );
}

function nextValue(
  name: string,
  value: string,
  prefix: string,
  notion?: string
): string {
  if (name.toLowerCase() === "srcset") {
    return prefixSrcset(value, prefix, notion);
  }
  return isRootRelative(value)
    ? prefixFor(value, prefix, notion) + value
    : value;
}

export function applyBase(
  html: string,
  base: string,
  notionBase?: string
): string {
  const prefix = base.replace(/\/+$/u, "");
  const notion = notionBase?.replace(/\/+$/u, "");
  if (prefix === "" && notion === undefined) {
    return html;
  }
  return html.replace(tagPattern, (tag) =>
    tag.replace(
      attrPattern,
      (
        whole,
        ws: string,
        name: string,
        eq: string,
        dq?: string,
        sq?: string
      ) => {
        const quote = dq === undefined ? "'" : '"';
        const value = dq ?? sq ?? "";
        const next = nextValue(name, value, prefix, notion);
        return next === value
          ? whole
          : `${ws}${name}${eq}${quote}${next}${quote}`;
      }
    )
  );
}
