// フッターのスポンサーの帯を1枚ずつ送る。全ページが読む素のJSで、Reactもライブラリも使わない。
// ロゴは2組ぶん並んでいて、1組ぶん進んだら位置だけ黙って引き戻す。見た目が同じなので切れ目なく回る。
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
  const count = slides.filter(
    (s) => s.dataset.sponsorsClone === undefined
  ).length;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  const goTo = (left) =>
    track.scrollTo({ left, behavior: reduced.matches ? "auto" : "smooth" });
  // CSSのscroll-behaviorがsmoothなので、位置だけ動かすときはinstantを明に指定する。
  const jump = (left) => track.scrollTo({ left, behavior: "instant" });

  // 1組ぶんの送り幅。2組目の先頭がここに来ると、1組目の先頭と同じ見た目になる。
  const loopWidth = () => slides[count]?.offsetLeft ?? 0;

  // 1組ぶん送れて、かつ引き戻せる余地があるときだけ回せる。
  const canLoop = () => {
    const loop = loopWidth();
    return loop > 0 && loop <= track.scrollWidth - track.clientWidth;
  };

  // 前へで1組ぶん右へ移している間は引き戻さない。左へ戻りきるまで待つ。
  let wrapping = false;

  // 1組ぶんより右へ出たら、アニメーションなしで同じ見た目の位置へ戻す。
  const normalize = () => {
    const loop = loopWidth();
    if (!canLoop()) {
      return;
    }
    // なめらかな送りは端数で止まることがあるので、1pxだけ手前から戻す。
    if (wrapping) {
      wrapping = track.scrollLeft >= loop - 1;
      return;
    }
    if (track.scrollLeft >= loop - 1) {
      jump(Math.max(track.scrollLeft - loop, 0));
    }
  };

  // 左端より左にある最後の1枚。
  const slideBefore = (left) => slides.findLast((s) => s.offsetLeft < left - 1);

  // 左端より右にある最初の1枚へ送る。
  const forward = () => {
    wrapping = false;
    normalize();
    const target = slides.find((s) => s.offsetLeft > track.scrollLeft + 1);
    if (target) {
      goTo(target.offsetLeft);
    }
  };

  // 左端より左にある最後の1枚へ戻す。左に無いときは1組ぶん右へ移してから戻す。
  const backward = () => {
    wrapping = false;
    normalize();
    let from = track.scrollLeft;
    if (!slideBefore(from) && canLoop()) {
      wrapping = true;
      from += loopWidth();
      jump(from);
    }
    const target = slideBefore(from);
    goTo(target ? target.offsetLeft : 0);
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

  // 1組ぶん回せるときだけボタンを出す。幅が変わるたびに付け直す。
  const sync = () => {
    const loops = canLoop();
    prev.hidden = !loops;
    next.hidden = !loops;
    toggle.hidden = !loops;
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
  track.addEventListener("scroll", normalize);
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
