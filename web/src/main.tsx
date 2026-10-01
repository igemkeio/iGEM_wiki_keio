import { mountIslands } from "./client/islands";
import { rememberLocaleOnClick } from "./client/locale";
// ブラウザ側のエントリ。CSSをViteに束ねさせ、島を使うページにだけJSを読み込む。
// import.meta.globは静的importより先に評価されるので、@layerの宣言を含むglobal.cssもglobで先に読む。
import.meta.glob("./styles/global.css", { eager: true });
import.meta.glob("./components/**/*.module.css", { eager: true });
rememberLocaleOnClick();
mountIslands();
