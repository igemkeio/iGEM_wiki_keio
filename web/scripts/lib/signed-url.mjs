const SIGNED_URL_MARKER = "prod-files-secure";

// 書き出すcontent文字列にNotionの署名付きURLが残っているか。
export function hasSignedUrl(text) {
  return text.includes(SIGNED_URL_MARKER);
}

// Actions の Step Summary に追記する Markdown。残っているページが無ければ空文字。
export function signedUrlSummary(names) {
  if (names.length === 0) {
    return "";
  }
  return [
    "## 署名付きURLが残ったページ",
    `Notionの署名付きURL(${SIGNED_URL_MARKER})が残っているページ: ${names.length} 件`,
    "",
    "```",
    ...names,
    "```",
    "",
  ].join("\n");
}
