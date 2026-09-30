// ブラウザ側のエントリ。CSSをViteに束ねさせ、島を使うページにだけJSを読み込む。
import "./styles/global.css";
// 部品のCSSはビルド時のSSRでしか参照されない。副作用だけのimportは捨てられるので、値として参照して束ねる。
import footer from "./components/Footer.module.css";
import pageShell from "./components/PageShell.module.css";
import sidebar from "./components/Sidebar.module.css";
import toc from "./components/Toc.module.css";

Object.assign(globalThis, { wikiStyles: [footer, pageShell, sidebar, toc] });
