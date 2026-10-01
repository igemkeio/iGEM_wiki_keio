// tsc でサンプルJSONが WikiPage 型に合うことを確かめるためのファイル。
import en from "../../content/en/home.json";
import ja from "../../content/ja/home.json";
import { readPage } from "./content";
import type { WikiPage } from "./content";

export const pages: WikiPage[] = [
  readPage(en, "content/en/home.json"),
  readPage(ja, "content/ja/home.json"),
];
