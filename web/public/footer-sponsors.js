// フッターのスポンサーの帯を1枚ずつ送る。全ページが読む素のJSで、Reactもライブラリも使わない。
// JSが無いときは、帯が横スクロールのまま残り、送りのボタンは hidden のまま出ない。帯がはみ出さないときもボタンは出ない。
(() => {
  const INTERVAL = 3000;
  const root = document.querySelector("[data-sponsors]");
  const track = root?.querySelector("[data-sponsors-track]");
  const prev = root?.querySelector("[data-sponsors-prev]");
  const next = root?.querySelector("[data-sponsors-next]");
  if (!(root && track && prev && next)) {
    return;
  }
  const slides = [...track.children];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const goTo = (left) =>
    track.scrollTo({ left, behavior: reduced.matches ? "auto" : "smooth" });

  // 先頭が左端より右にある最初の1枚へ送る。末尾まで来ていれば先頭に戻る。
  const forward = () => {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    const target = slides.find((s) => s.offsetLeft > track.scrollLeft + 1);
    goTo(atEnd || !target ? 0 : target.offsetLeft);
  };

  const backward = () => {
    const target = slides.findLast((s) => s.offsetLeft < track.scrollLeft - 1);
    goTo(target ? target.offsetLeft : 0);
  };

  // 帯がはみ出すときだけボタンを出す。幅が変わるたびに付け直す。
  const sync = () => {
    const overflows = track.scrollWidth > track.clientWidth + 1;
    prev.hidden = !overflows;
    next.hidden = !overflows;
  };

  root.dataset.sponsorsJs = "";
  sync();
  new ResizeObserver(sync).observe(track);
  prev.addEventListener("click", backward);
  next.addEventListener("click", forward);

  // ホバー中、帯の中にフォーカスがある間、reduced-motionのときは自動で送らない。
  setInterval(() => {
    if (
      reduced.matches ||
      root.matches(":hover") ||
      root.matches(":focus-within")
    ) {
      return;
    }
    forward();
  }, INTERVAL);
})();
