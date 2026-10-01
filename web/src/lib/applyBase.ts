// 原稿htmlのroot相対URL(/で始まり//で始まらない)に、配信パスの接頭辞baseを付ける。
const tagPattern = /<[a-zA-Z][a-zA-Z0-9-]*(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const attrPattern = /(\s)(src|href|poster|srcset)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi;

function isRootRelative(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

// srcsetは候補を","で区切り、各候補の先頭がURL。URL自体の","は空白までを1語として扱う。
function prefixSrcset(value: string, prefix: string): string {
  return value.replace(/(^|,)(\s*)(\S+)/g, (whole, sep: string, space: string, url: string) => {
    if (!isRootRelative(url)) return whole;
    return `${sep}${space}${prefix}${url}`;
  });
}

export function applyBase(html: string, base: string): string {
  const prefix = base.replace(/\/+$/, "");
  if (prefix === "") return html;
  return html.replace(tagPattern, (tag) =>
    tag.replace(attrPattern, (whole, ws: string, name: string, eq: string, dq?: string, sq?: string) => {
      const quote = dq !== undefined ? '"' : "'";
      const value = dq ?? sq ?? "";
      const next =
        name.toLowerCase() === "srcset"
          ? prefixSrcset(value, prefix)
          : isRootRelative(value)
            ? prefix + value
            : value;
      return next === value ? whole : `${ws}${name}${eq}${quote}${next}${quote}`;
    }),
  );
}
