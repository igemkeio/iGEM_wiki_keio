// notion-imagesとnotion-filesの配信元の親URL。目印はビルド時にvite.config.tsのasset-baseが環境変数WIKI_NOTION_BASEに置き換える。
// 未指定なら空になり、applyBaseは配信パスのbaseを付ける。
const value = "__WIKI_NOTION_BASE__" as string;

export const notionBase: string | undefined = value === "" ? undefined : value;
