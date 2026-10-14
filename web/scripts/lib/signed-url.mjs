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

// Step Summary のファイルに追記する。パスが無い(Actions の外)か内容が空なら書かない。
// 書き込みに失敗しても例外にせず、warn に渡して同期を続ける。
export function appendStepSummary(file, markdown, append, warn) {
  if (!(file && markdown)) {
    return;
  }
  try {
    append(file, markdown);
  } catch (error) {
    warn(`Step Summary に書き込めませんでした: ${error.message}`);
  }
}
