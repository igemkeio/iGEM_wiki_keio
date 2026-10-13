const SIGNED_URL_MARKER = "prod-files-secure";

// 書き出すcontent文字列にNotionの署名付きURLが残っているか。
export function hasSignedUrl(text) {
  return text.includes(SIGNED_URL_MARKER);
}
