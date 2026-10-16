import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Locale } from "../content";
import {
  buildStops,
  cycleMark,
  cycleUses,
  dbtlText,
  doneAtOf,
  figurePartOf,
  PHASES,
  TOOL_CYCLES,
} from "../lib/dbtl";
import type { CycleSummary, FigurePart, Stop } from "../lib/dbtl";
import { CellFigure } from "./CellFigure";
import type { FigureTarget } from "./CellFigure";
import { DbtlRing } from "./DbtlRing";

import styles from "./DbtlStage.module.css";

// 箱の上から42%の線にかかっている節を、今の位置とする。
const LINE = 0.42;
const THRESHOLDS = Array.from({ length: 11 }, (_, i) => i / 10);
const NO_CYCLES: CycleSummary[] = [];
// サイクルが1つも無いときに使う空の値。描画の分岐を増やさないために置く。
const NO_CYCLE: CycleSummary = {
  no: 0,
  layer: "base",
  title: "",
  tagline: "",
  iterations: [],
};
const NO_ITERATION = { no: 1, title: "" };

type Text = ReturnType<typeof dbtlText>;

const prefersReduce = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

// 輪の見た目。読み進めた弧を点け、フェーズの中ならその弧だけ太くする。
function ringStateOf(stop: Stop | undefined, iterationCount: number) {
  if (!stop || stop.kind === "intro") {
    return { iteration: 0, upto: -1, phase: -1 };
  }
  if (stop.kind === "focus") {
    return { iteration: stop.iter, upto: 0, phase: -1 };
  }
  if (stop.kind === "phase") {
    return { iteration: stop.iter, upto: stop.phase, phase: stop.phase };
  }
  if (stop.kind === "lap") {
    return { iteration: stop.iter, upto: PHASES.length - 1, phase: -1 };
  }
  return { iteration: iterationCount - 1, upto: PHASES.length - 1, phase: -1 };
}

function phaseLabelOf(stop: Stop | undefined, t: Text, iterationNo: number) {
  if (stop?.kind === "phase") {
    return PHASES[stop.phase].toUpperCase();
  }
  if (stop?.kind === "lap") {
    return `${t.iteration} ${iterationNo} ${t.complete}`;
  }
  return `${t.iteration} ${iterationNo}`;
}

// 箱のスクロールと節の行き来。箱の中身はDOMを引いて、印の付け外しとスクロールだけ行う。
function useDbtlReader(stops: Stop[]) {
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState(false);
  const boxRef = useRef<HTMLElement | null>(null);
  const elsRef = useRef<HTMLElement[]>([]);
  const byKeyRef = useRef(false);
  const rafRef = useRef(0);
  const releaseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(0);

  const go = useCallback(
    (to: number) => {
      const box = boxRef.current;
      const els = elsRef.current;
      if (!box || els.length === 0) {
        return;
      }
      const k = Math.max(0, Math.min(els.length - 1, to));
      const el = els[k];
      const height = box.clientHeight;
      const center =
        height * LINE - Math.min(el.offsetHeight, height * 0.5) / 2;
      const top =
        stops[k]?.kind === "focus" ? el.offsetTop - 16 : el.offsetTop - center;
      byKeyRef.current = true;
      setIndex(k);
      box.scrollTo({ top, behavior: prefersReduce() ? "auto" : "smooth" });
      if (releaseRef.current) {
        clearTimeout(releaseRef.current);
      }
      releaseRef.current = setTimeout(() => {
        byKeyRef.current = false;
      }, 900);
    },
    [stops]
  );

  const goToCycle = useCallback(
    (no: number) => {
      const to = stops.findIndex((s) => s.kind === "intro" && s.cycle === no);
      if (to !== -1) {
        go(to);
      }
    },
    [go, stops]
  );

  useEffect(() => {
    const box = document.querySelector<HTMLElement>("#dbtl-box");
    if (!box) {
      return;
    }
    boxRef.current = box;
    elsRef.current = [
      ...box.querySelectorAll<HTMLElement>("[data-dbtl-stop]"),
    ].slice(0, stops.length);
    const nearest = () => {
      const line = box.scrollTop + box.clientHeight * LINE;
      let best = 0;
      let shortest = Infinity;
      for (const [k, el] of elsRef.current.entries()) {
        const top = el.offsetTop;
        const d = Math.max(top - line, line - (top + el.offsetHeight), 0);
        if (d < shortest) {
          shortest = d;
          best = k;
        }
      }
      return best;
    };
    const onScroll = () => {
      if (byKeyRef.current || rafRef.current) {
        return;
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        setIndex(nearest());
      });
    };
    const release = () => {
      byKeyRef.current = false;
    };
    const events = ["wheel", "touchstart", "pointerdown"] as const;
    box.addEventListener("scroll", onScroll, { passive: true });
    for (const name of events) {
      box.addEventListener(name, release, { passive: true });
    }
    // 読み込み直後にブラウザが位置を戻すことがあるので、描画の後に合わせ直す。
    const first = requestAnimationFrame(() => setIndex(nearest()));
    return () => {
      box.removeEventListener("scroll", onScroll);
      for (const name of events) {
        box.removeEventListener(name, release);
      }
      cancelAnimationFrame(first);
      cancelAnimationFrame(rafRef.current);
      if (releaseRef.current) {
        clearTimeout(releaseRef.current);
      }
    };
  }, [stops.length]);

  // 箱の中身には、今いる節の印を付けるだけにする。箱を引く効果の後に走らせる。
  useEffect(() => {
    indexRef.current = index;
    for (const [k, el] of elsRef.current.entries()) {
      el.toggleAttribute("data-dbtl-current", k === index);
    }
  }, [index]);

  // 矢印キーは、ステージが画面の半分以上を占めているときだけ効く。
  useEffect(() => {
    const stage = document.querySelector("#dbtl-stage");
    if (!stage) {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.intersectionRatio >= 0.5),
      { threshold: THRESHOLDS }
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const { target } = event;
      if (
        target instanceof Element &&
        target.closest("input, textarea, select, [contenteditable]")
      ) {
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        go(indexRef.current + 1);
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        go(indexRef.current - 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active, go]);

  return { index, go, goToCycle };
}

// 基盤では手に入れた道具を、設計では使っている基盤を並べる。
function Tools({
  t,
  base,
  list,
  isDone,
  titleOf,
}: {
  t: Text;
  base: boolean;
  list: readonly number[];
  isDone: (no: number) => boolean;
  titleOf: (no: number) => string;
}) {
  return (
    <div className={styles.tools}>
      <h3>{base ? t.toolsGained : t.using}</h3>
      {list.map((no) => (
        <p
          key={no}
          className={
            base && !isDone(no) ? styles.tool : `${styles.tool} ${styles.got}`
          }
        >
          <b>{cycleMark(no)}</b>
          <span className={styles.toolName}>
            {t.tools[no as 1 | 2 | 3] ?? ""}
          </span>
          <span className={styles.toolCycle}>{titleOf(no)}</span>
        </p>
      ))}
    </div>
  );
}

// 下の絵のナビ。基盤の3つは絵の外に並べ、設計の3サイクルは絵の3か所に割り当てる。
function FootNav({
  t,
  bases,
  targets,
  lit,
  current,
  shown,
  onHot,
  onSelect,
  isDone,
  titleOf,
  layerOf,
}: {
  t: Text;
  bases: readonly number[];
  targets: FigureTarget[];
  lit: FigurePart[];
  current: number;
  shown: number;
  onHot: (no: number | null) => void;
  onSelect: (no: number) => void;
  isDone: (no: number) => boolean;
  titleOf: (no: number) => string;
  layerOf: (no: number) => string;
}) {
  return (
    <nav className={styles.foot} aria-label={t.stage}>
      <div className={styles.figure}>
        <div className={styles.bases}>
          {bases.map((no) => (
            <a
              key={no}
              className={[
                styles.baseLink,
                isDone(no) ? styles.done : "",
                current === no ? styles.current : "",
              ]
                .filter(Boolean)
                .join(" ")}
              href={`#dbtl-cycle-${no}`}
              onClick={(event) => {
                event.preventDefault();
                onSelect(no);
              }}
              onMouseEnter={() => onHot(no)}
              onMouseLeave={() => onHot(null)}
              onFocus={() => onHot(no)}
              onBlur={() => onHot(null)}
            >
              <span className={styles.mark}>{cycleMark(no)}</span>
              {t.tools[no as 1 | 2 | 3] ?? titleOf(no)}
            </a>
          ))}
        </div>
        <CellFigure
          targets={targets}
          lit={lit}
          alt={t.figureAlt}
          onSelect={onSelect}
          onHover={onHot}
          onLeave={() => onHot(null)}
        />
      </div>
      <p className={styles.preview}>
        <b>
          {layerOf(shown)} · {cycleMark(shown)}
        </b>
        {titleOf(shown)}
      </p>
    </nav>
  );
}

// 上の題、輪、道具の表示、下の絵のナビ。本文は箱(#dbtl-box)にあり、この島は描き直さない。
export default function DbtlStage({
  locale = "ja",
  cycles = NO_CYCLES,
}: {
  locale?: Locale;
  cycles?: CycleSummary[];
}) {
  const t = dbtlText(locale);
  const stops = useMemo(() => buildStops(cycles), [cycles]);
  const doneAt = useMemo(() => doneAtOf(stops), [stops]);
  const { index, go, goToCycle } = useDbtlReader(stops);
  const [hot, setHot] = useState<number | null>(null);
  const [bumpKey, setBumpKey] = useState(0);

  const stop = stops[index] ?? stops[0];
  const cycle =
    cycles.find((c) => c.no === stop?.cycle) ?? cycles[0] ?? NO_CYCLE;
  const iterationCount = Math.max(cycle.iterations.length, 1);
  const { iteration, upto, phase } = ringStateOf(stop, iterationCount);
  const shownIteration = cycle.iterations[iteration] ?? NO_ITERATION;
  const iterationNo = shownIteration.no;

  // 反復の番号が上がったときだけ弾ませる。
  const shownNo = useRef<number | null>(null);
  useEffect(() => {
    if (shownNo.current !== null && iterationNo > shownNo.current) {
      setBumpKey((k) => k + 1);
    }
    shownNo.current = iterationNo;
  }, [iterationNo]);

  const isDone = (no: number) =>
    doneAt[no] !== undefined && index >= doneAt[no];
  const titleOf = (no: number) => cycles.find((c) => c.no === no)?.title ?? "";
  const layerOf = (no: number) =>
    t.layer[cycles.find((c) => c.no === no)?.layer ?? "base"];
  const base = cycle.layer === "base";
  const bases = TOOL_CYCLES.filter((no) => cycles.some((c) => c.no === no));
  const targets: FigureTarget[] = cycles.flatMap((c) => {
    const part = figurePartOf(c.no);
    return part
      ? [{ part, no: c.no, label: `${cycleMark(c.no)} ${c.title}` }]
      : [];
  });
  const lit = [...cycles.map((c) => c.no).filter(isDone), cycle.no, hot]
    .map((no) => (typeof no === "number" ? figurePartOf(no) : undefined))
    .filter((part): part is FigurePart => part !== undefined);
  const shown = hot ?? cycle.no;

  const pickPhase = (j: number) => {
    const to = stops.findIndex(
      (s) =>
        s.kind === "phase" &&
        s.cycle === cycle.no &&
        s.iter === iteration &&
        s.phase === j
    );
    if (to !== -1) {
      go(to);
    }
  };

  return (
    <>
      <header className={styles.top}>
        <p className={styles.eyebrow}>
          {`${layerOf(cycle.no)} / ${t.cycle(cycleMark(cycle.no))}`}
        </p>
        <p className={styles.cycleTitle}>{cycle.title}</p>
        <p className={styles.tagline}>{cycle.tagline}</p>
        <div className={styles.jump}>
          <button
            type="button"
            aria-label={t.prev}
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={t.next}
            disabled={index >= stops.length - 1}
            onClick={() => go(index + 1)}
          >
            ↓
          </button>
        </div>
      </header>
      <aside className={styles.side}>
        <div className={styles.ringBox}>
          <DbtlRing
            caption={t.iteration}
            phase={phase}
            upto={upto}
            iteration={iteration}
            iterationNo={iterationNo}
            iterationCount={iterationCount}
            bumpKey={bumpKey}
            onPick={pickPhase}
          />
        </div>
        <div className={styles.meta}>
          <p
            className={styles.phase}
            style={
              phase === -1
                ? undefined
                : { color: `var(--color-dbtl-${PHASES[phase]})` }
            }
          >
            {phaseLabelOf(stop, t, iterationNo)}
          </p>
          <p className={styles.iterTitle}>{shownIteration.title}</p>
        </div>
        <Tools
          t={t}
          base={base}
          list={base ? bases : cycleUses(cycle.no)}
          isDone={isDone}
          titleOf={titleOf}
        />
      </aside>
      <FootNav
        t={t}
        bases={bases}
        targets={targets}
        lit={lit}
        current={cycle.no}
        shown={shown}
        onHot={setHot}
        onSelect={goToCycle}
        isDone={isDone}
        titleOf={titleOf}
        layerOf={layerOf}
      />
    </>
  );
}
