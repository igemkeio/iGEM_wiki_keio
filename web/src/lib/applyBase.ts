// 原稿htmlのroot相対URL(/で始まり//で始まらない)に、配信パスの接頭辞baseを付ける。
const tagPattern = /<[a-zA-Z][a-zA-Z0-9-]*(?:"[^"]*"|'[^']*'|[^>"'])*>/gu;
const attrPattern =
  /(\s)(src|href|poster|srcset)(\s*=\s*)(?:"([^"]*)"|'([^']*)')/giu;

function isRootRelative(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

// srcsetは候補を","で区切り、各候補の先頭がURL。URL自体の","は空白までを1語として扱う。
function prefixSrcset(value: string, prefix: string): string {
  return value.replaceAll(
    /(^|,)(\s*)(\S+)/gu,
    (whole, sep: string, space: string, url: string) => {
      if (isRootRelative(url)) {
        return `${sep}${space}${prefix}${url}`;
      }
      return whole;
    }
  );
}

function nextValue(name: string, value: string, prefix: string): string {
  if (name.toLowerCase() === "srcset") {
    return prefixSrcset(value, prefix);
  }
  return isRootRelative(value) ? prefix + value : value;
}

export function applyBase(html: string, base: string): string {
  const prefix = base.replace(/\/+$/u, "");
  if (prefix === "") {
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
        const next = nextValue(name, value, prefix);
        return next === value
          ? whole
          : `${ws}${name}${eq}${quote}${next}${quote}`;
      }
    )
  );
}
