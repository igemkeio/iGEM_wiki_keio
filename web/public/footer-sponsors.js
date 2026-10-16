// フッターのスポンサーの帯を1枚ずつ送る。全ページが読む素のJSで、Reactもライブラリも使わない。
// JSが無いときは、帯が横スクロールのまま残り、送りと一時停止のボタンは hidden のまま出ない。帯がはみ出さないときもボタンは出ない。
(() => {
  const INTERVAL = 3000;
  const root = document.querySelector("[data-sponsors]");
  const track = root?.querySelector("[data-sponsors-track]");
  const prev = root?.querySelector("[data-sponsors-prev]");
  const next = root?.querySelector("[data-sponsors-next]");
  const toggle = root?.querySelector("[data-sponsors-toggle]");
  if (!(root && track && prev && next && toggle)) {
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

  // 左端より左にある最後の1枚へ戻す。先頭にいれば末尾へ回る。
  const backward = () => {
    const target = slides.findLast((s) => s.offsetLeft < track.scrollLeft - 1);
    goTo(target ? target.offsetLeft : track.scrollWidth - track.clientWidth);
  };

  // 一時停止の間は、ホバーやフォーカスが外れても自動で送らない。reduced-motionのときは初めから一時停止にする。
  let paused = reduced.matches;
  const syncToggle = () => {
    toggle.toggleAttribute("data-paused", paused);
    toggle.setAttribute(
      "aria-label",
      paused ? toggle.dataset.labelPlay : toggle.dataset.labelPause
    );
  };

  // 帯がはみ出すときだけボタンを出す。幅が変わるたびに付け直す。
  const sync = () => {
    const overflows = track.scrollWidth > track.clientWidth + 1;
    prev.hidden = !overflows;
    next.hidden = !overflows;
    toggle.hidden = !overflows;
  };

  // 一時停止の間、ホバー中、帯の中にフォーカスがある間は自動で送らない。
  // 一時停止と再生のボタンへのホバーとフォーカスは数えない。
  const tick = () => {
    const hovering = root.matches(":hover") && !toggle.matches(":hover");
    const focusing = root.matches(":focus-within") && !toggle.matches(":focus");
    if (paused || hovering || focusing) {
      return;
    }
    forward();
  };

  // 再生にしたときは周期を張り直し、最初の送りを再生の3秒後にする。
  let timer = setInterval(tick, INTERVAL);
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(tick, INTERVAL);
  };

  root.dataset.sponsorsJs = "";
  sync();
  syncToggle();
  const observer = new ResizeObserver(sync);
  observer.observe(track);
  for (const slide of slides) {
    observer.observe(slide);
  }
  prev.addEventListener("click", backward);
  next.addEventListener("click", forward);
  toggle.addEventListener("click", () => {
    paused = !paused;
    syncToggle();
    if (!paused) {
      restart();
    }
  });
  // 設定がreduceに変わったときは止める。戻ったときは利用者の選択のままにする。
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      paused = true;
      syncToggle();
    }
  });
})();
