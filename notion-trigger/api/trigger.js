// Notion のボタンから叩かれる中継エンドポイント。
// GET でアクセスされると GitHub Actions の workflow_dispatch を起動する。
//
// Notion ボタン側は「リンクを開く」で次の URL を指定:
//   https://<this-app>.vercel.app/api/trigger?key=<TRIGGER_SECRET>
//
// 必要な環境変数（Vercel の Project Settings → Environment Variables）:
//   GITHUB_TOKEN   … repo + workflow 権限を持つ PAT（fine-grained 可）
//   GH_OWNER       … 例: jiku0730
//   GH_REPO        … 例: iGEM_wiki_keio
//   WORKFLOW_FILE  … 例: notion-sync.yml
//   TRIGGER_SECRET … 任意の長い文字列。URL の ?key= と一致しないと弾く
//   DISPATCH_REF   … 任意。既定 main

export default async function handler(req, res) {
  const {
    GITHUB_TOKEN,
    GH_OWNER,
    GH_REPO,
    WORKFLOW_FILE = "notion-sync.yml",
    TRIGGER_SECRET,
    DISPATCH_REF = "main",
  } = process.env;

  if (!GITHUB_TOKEN || !GH_OWNER || !GH_REPO || !TRIGGER_SECRET) {
    res.status(500).send("Server not configured.");
    return;
  }

  // 簡易認証: URL の ?key= が TRIGGER_SECRET と一致しなければ拒否。
  if (req.query.key !== TRIGGER_SECRET) {
    res.status(403).send("Forbidden.");
    return;
  }

  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const gh = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: DISPATCH_REF }),
  });

  if (gh.status !== 204) {
    const text = await gh.text();
    res.status(502).send(`GitHub dispatch failed (${gh.status}): ${text}`);
    return;
  }

  // ブラウザで開かれる前提なので、人間向けの小さな確認ページを返す。
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html><meta charset="utf-8">
<title>Notion Sync</title>
<div style="font-family:sans-serif;max-width:32rem;margin:4rem auto;text-align:center">
  <h1>✅ 同期を開始しました</h1>
  <p>GitHub Actions が起動しました。数分後に PR が作成され、Vercel の Preview がビルドされます。</p>
  <p><a href="https://github.com/${GH_OWNER}/${GH_REPO}/actions">Actions の進行状況を見る →</a></p>
</div>`);
}
