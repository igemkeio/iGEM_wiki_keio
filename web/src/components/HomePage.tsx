import type { CSSProperties } from "react";

import { withBase } from "../base";
import type { WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";
import { groupRoutes } from "../lib/navGroups";
import { notionBase } from "../lib/notionBase";
import type { Route } from "../routes";

import styles from "./HomePage.module.css";

// ビルド時にvite.config.tsのプラグインが画像の配信元に置き換える。
const imageBase = "__WIKI_IMAGE_BASE__";

interface SlideFigure {
  // 図の番号。決まっていない図は省く。
  number?: number;
  // 図の見出し(ENERGYなど)。
  heading?: string;
  // 仮の枠に書く図の内容。
  content: string;
  // 差し替え後の画像。imageBaseからの相対パス、alt、実寸。
  image?: { src: string; alt: string; width: number; height: number };
}

// 線の色。lightは濃紺の地の上の細い線。
type Tone = "on" | "warn" | "lit" | "light";

interface Rail {
  // viewBoxの高さ。幅は60で共通。
  height: number;
  paths: { d: string; tone: Tone }[];
}

interface Slide {
  sentence: string;
  // 並べ方。stackは文の下に全幅、asideは左に文と右に図。
  layout: "stack" | "trio" | "pair" | "aside" | "turn" | "quiet";
  size: "sm" | "md" | "lg";
  rail: Rail;
  figures: SlideFigure[];
  note?: { title: string; text: string };
}

const rail400 = (paths: Rail["paths"]): Rail => ({ height: 400, paths });

const fan = (spread: number, tone: Tone): Rail =>
  rail400([
    { d: "M30,0 V120", tone },
    { d: `M30,120 C30,${spread} 10,${spread} 10,400`, tone },
    { d: "M30,120 V400", tone },
    { d: `M30,120 C30,${spread} 50,${spread} 50,400`, tone },
  ]);

const slides: Slide[] = [
  {
    sentence: "Individually, we may be weak. But together, we become stronger.",
    layout: "stack",
    size: "md",
    rail: rail400([{ d: "M30,0 V400", tone: "on" }]),
    figures: [{ content: "Individuals joining into a group" }],
  },
  {
    sentence:
      "The more diverse a collective is, the more challenges it can overcome.",
    layout: "trio",
    size: "md",
    rail: fan(230, "on"),
    figures: [
      { number: 1, heading: "ENERGY", content: "Energy applications" },
      {
        number: 2,
        heading: "MATERIAL / HEALTHCARE",
        content: "Material and healthcare applications",
      },
      {
        number: 3,
        heading: "BIOPRODUCTION",
        content: "Bioproduction applications",
      },
    ],
  },
  {
    sentence:
      "But what happens when everyone is moving in a different direction?",
    layout: "pair",
    size: "md",
    rail: rail400([
      {
        d: "M10,0 C10,110 50,150 50,260 C50,340 18,340 18,400",
        tone: "warn",
      },
      { d: "M30,0 C30,120 8,170 8,250 C8,330 44,330 44,400", tone: "warn" },
      { d: "M50,0 C50,100 22,130 22,230 C22,330 32,330 32,400", tone: "warn" },
    ]),
    figures: [
      {
        number: 4,
        heading: "Conflict?",
        content: "Units pushing against each other",
      },
      { number: 5, heading: "Gridlock?", content: "Units blocking each other" },
    ],
  },
  {
    sentence:
      "In cellular systems, disorganized collectives can become dangerous, as seen in cancer.",
    layout: "aside",
    size: "sm",
    rail: rail400([
      {
        d: "M18,0 C54,60 6,100 42,160 C6,220 54,260 18,320 C40,350 20,370 30,400",
        tone: "warn",
      },
      {
        d: "M42,0 C6,70 54,110 18,170 C54,230 6,270 42,330 C20,355 40,372 30,400",
        tone: "warn",
      },
    ]),
    figures: [{ number: 6, content: "Disorganized cells growing as cancer" }],
  },
  {
    sentence:
      "Order begins with direction. What we need is a way to bring order to the collective.",
    layout: "turn",
    size: "sm",
    rail: {
      height: 300,
      paths: [
        { d: "M6,0 C6,90 30,90 30,160", tone: "light" },
        { d: "M30,0 V160", tone: "light" },
        { d: "M54,0 C54,90 30,90 30,160", tone: "light" },
        { d: "M30,160 V300", tone: "lit" },
      ],
    },
    figures: [],
    note: {
      title: "ONE DIRECTION",
      text: "Giving direction to cellular system",
    },
  },
  {
    sentence:
      "We propose a mechanism that uses synthetic biology to organize and align engineered materials and molecular robots into structured assemblies.",
    layout: "quiet",
    size: "lg",
    rail: rail400([{ d: "M30,0 V400", tone: "lit" }]),
    figures: [],
  },
  {
    sentence: "A new dimension in cellular engineering",
    layout: "trio",
    size: "md",
    rail: fan(200, "lit"),
    figures: [
      { number: 8, heading: "linear", content: "Linear assembly" },
      { number: 8, heading: "circular", content: "Circular assembly" },
      { number: 8, heading: "planar", content: "Planar assembly" },
    ],
  },
  {
    sentence: "One platform. Infinite possibilities.",
    layout: "stack",
    size: "lg",
    rail: rail400([
      { d: "M30,0 V100", tone: "lit" },
      { d: "M30,100 C30,220 2,240 2,400", tone: "lit" },
      { d: "M30,100 C30,220 16,240 16,400", tone: "lit" },
      { d: "M30,100 V400", tone: "lit" },
      { d: "M30,100 C30,220 44,240 44,400", tone: "lit" },
      { d: "M30,100 C30,220 58,240 58,400", tone: "lit" },
    ]),
    figures: [{ number: 9, content: "The platform and its applications" }],
  },
];

// 入口に添える一文。キーは nav-categories.json の分類id。
const doorText: Record<string, string> = {
  project: "What we build, and why it has to be built this way.",
  "wet-lab": "Constructs, strains, and the bench record.",
  "dry-lab": "Models that tell us where the limits are.",
  "human-practices": "Who we asked, and what we changed.",
  team: "The people behind iGEM Keio 2026.",
};

function FigureItem({ figure }: { figure: SlideFigure }) {
  return (
    <figure className={styles.figure}>
      {figure.image ? (
        <img
          className={styles.figureImage}
          src={`${imageBase}/${figure.image.src}`}
          alt={figure.image.alt}
          width={figure.image.width}
          height={figure.image.height}
        />
      ) : (
        <div className={styles.placeholder}>
          <p className={styles.placeholderTitle}>
            {figure.number === undefined
              ? "Figure (placeholder)"
              : `Figure ${figure.number} (placeholder)`}
          </p>
          <p>{figure.content}</p>
        </div>
      )}
      {figure.heading && (
        <figcaption className={styles.figureHeading}>
          {figure.heading}
        </figcaption>
      )}
    </figure>
  );
}

// 左の縦線。スクロールに合わせて引かれる。
function RailLine({ rail, num }: { rail: Rail; num?: number }) {
  return (
    <span className={styles.rail} aria-hidden="true">
      <svg viewBox={`0 0 60 ${rail.height}`} preserveAspectRatio="none">
        {rail.paths.map(({ d, tone }) => (
          <path
            key={d}
            className={`${styles.thread} ${styles[tone]}`}
            d={d}
            pathLength={1}
          />
        ))}
      </svg>
      {num !== undefined && (
        <span className={styles.num}>{String(num).padStart(2, "0")}</span>
      )}
    </span>
  );
}

// ヒーローを持つHome専用の本文。
export function HomePage({
  page,
  routes,
}: {
  page: WikiPage;
  routes: Route[];
}) {
  const doors = groupRoutes(page.locale, routes).filter(
    (g) => g.routes.length > 0
  );
  return (
    <main className={styles.main}>
      <h1 className={styles.visuallyHidden}>{page.title}</h1>
      <section className={styles.hero}>
        <picture className={styles.art}>
          <source
            media="(max-width: 1600px)"
            srcSet={`${imageBase}/hero-ukiyoe-1600.webp`}
          />
          <img
            src={`${imageBase}/hero-ukiyoe.webp`}
            alt=""
            width={2623}
            height={1415}
            loading="eager"
            fetchPriority="high"
          />
        </picture>
        <img
          className={styles.logo}
          src={`${imageBase}/one-direction.png`}
          alt="One Direction"
          width={632}
          height={228}
        />
        {page.lead && (
          <p
            className={styles.catch}
            dangerouslySetInnerHTML={{
              __html: applyBase(
                page.lead,
                import.meta.env.BASE_URL,
                notionBase
              ),
            }}
          />
        )}
        <div className={styles.about}>
          <p className={styles.name}>iGEM Keio 2026</p>
          {page.subtitle && <p className={styles.tagline}>{page.subtitle}</p>}
          {page.html && (
            <div
              data-testid="home-description"
              className={styles.description}
              dangerouslySetInnerHTML={{
                __html: applyBase(
                  page.html,
                  import.meta.env.BASE_URL,
                  notionBase
                ),
              }}
            />
          )}
        </div>
      </section>
      <div className={styles.bridge}>
        <RailLine
          rail={{ height: 190, paths: [{ d: "M30,-6 V190", tone: "on" }] }}
        />
        <p className={styles.bridgeWord}>
          <span className={styles.bridgeKicker}>One line, from here</span>
          <span className={styles.bridgeTitle}>
            Why a collective needs a direction
          </span>
        </p>
      </div>
      {slides.map((slide, index) => (
        <section
          key={slide.sentence}
          className={`${styles.slide} ${styles[slide.layout]}`}
          data-testid="home-slide"
        >
          <RailLine
            rail={slide.rail}
            num={slide.layout === "turn" ? undefined : index + 1}
          />
          <div className={styles.body}>
            {slide.layout === "quiet" && <span className={styles.mark} />}
            <h2 className={`${styles.sentence} ${styles[slide.size]}`}>
              {slide.sentence}
            </h2>
            {slide.note && (
              <div className={styles.note}>
                <p className={styles.noteTitle}>
                  {slide.note.title}
                  <svg
                    className={styles.arrow}
                    viewBox="0 0 120 40"
                    aria-hidden="true"
                  >
                    <path d="M0,20 H96" stroke="currentColor" strokeWidth="8" />
                    <polygon points="92,2 120,20 92,38" fill="currentColor" />
                  </svg>
                </p>
                <p className={styles.noteText}>{slide.note.text}</p>
              </div>
            )}
            {slide.figures.length > 0 && (
              <div
                className={styles.figures}
                style={
                  { "--figure-count": slide.figures.length } as CSSProperties
                }
              >
                {slide.figures.map((figure, i) => (
                  <FigureItem key={`${i}-${figure.content}`} figure={figure} />
                ))}
              </div>
            )}
            {slide.layout === "quiet" && <span className={styles.mark} />}
          </div>
        </section>
      ))}
      <section className={styles.outro}>
        <RailLine
          rail={{ height: 300, paths: [{ d: "M30,0 V300", tone: "lit" }] }}
        />
        <div>
          <p className={styles.lede}>
            Four poles, one direction.
            <br />
            Start anywhere.
          </p>
          <div className={styles.doors}>
            {doors.map(({ category, routes: items }) => (
              <a
                key={category.id}
                className={styles.door}
                href={withBase(items[0].path)}
              >
                <b>{category.label}</b>
                <span>{doorText[category.id]}</span>
                <i aria-hidden="true">&rarr;</i>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
