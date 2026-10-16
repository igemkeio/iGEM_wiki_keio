import type { CSSProperties } from "react";

import type { WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";

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
  // 差し替え後の画像。imageBaseからの相対パスとalt。
  image?: { src: string; alt: string };
}

interface Slide {
  sentence: string;
  figures: SlideFigure[];
  note?: { title: string; text: string };
}

const slides: Slide[] = [
  {
    sentence: "Individually, we may be weak. But together, we become stronger.",
    figures: [{ number: 1, content: "Individuals joining into a group" }],
  },
  {
    sentence:
      "The more diverse a collective is, the more challenges it can overcome.",
    figures: [
      { heading: "ENERGY", content: "Energy applications" },
      {
        heading: "MATERIAL / HEALTHCARE",
        content: "Material and healthcare applications",
      },
      { heading: "BIOPRODUCTION", content: "Bioproduction applications" },
    ],
  },
  {
    sentence:
      "But what happens when everyone is moving in a different direction?",
    figures: [
      { heading: "Conflict?", content: "Units pushing against each other" },
      { heading: "Gridlock?", content: "Units blocking each other" },
    ],
  },
  {
    sentence:
      "In cellular systems, disorganized collectives can become dangerous, as seen in cancer.",
    figures: [{ number: 6, content: "Disorganized cells growing as cancer" }],
  },
  {
    sentence:
      "Order begins with direction. What we need is a way to bring order to the collective.",
    figures: [{ number: 7, content: "Units aligned in one direction" }],
    note: {
      title: "ONE DIRECTION",
      text: "Giving direction to cellular system",
    },
  },
  {
    sentence:
      "We propose a mechanism that uses synthetic biology to organize and align engineered materials and molecular robots into structured assemblies.",
    figures: [],
  },
  {
    sentence: "A new dimension in cellular engineering",
    figures: [
      { heading: "linear", content: "Linear assembly" },
      { heading: "circular", content: "Circular assembly" },
      { heading: "planar", content: "Planar assembly" },
    ],
  },
  {
    sentence: "One platform. Infinite possibilities.",
    figures: [{ number: 9, content: "The platform and its applications" }],
  },
];

function FigureItem({ figure }: { figure: SlideFigure }) {
  return (
    <figure className={styles.figure}>
      {figure.heading && (
        <figcaption className={styles.figureHeading}>
          {figure.heading}
        </figcaption>
      )}
      {figure.image ? (
        <img
          className={styles.figureImage}
          src={`${imageBase}/${figure.image.src}`}
          alt={figure.image.alt}
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
    </figure>
  );
}

// ヒーローを持つHome専用の本文。
export function HomePage({ page }: { page: WikiPage }) {
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
              __html: applyBase(page.lead, import.meta.env.BASE_URL),
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
                __html: applyBase(page.html, import.meta.env.BASE_URL),
              }}
            />
          )}
        </div>
      </section>
      {slides.map((slide) => (
        <section
          key={slide.sentence}
          className={styles.slide}
          data-testid="home-slide"
        >
          <h2
            className={
              slide.figures.length === 0
                ? `${styles.sentence} ${styles.sentenceLarge}`
                : styles.sentence
            }
          >
            {slide.sentence}
          </h2>
          {slide.figures.length > 0 && (
            <div
              className={styles.figures}
              style={
                { "--figure-count": slide.figures.length } as CSSProperties
              }
            >
              {slide.figures.map((figure) => (
                <FigureItem
                  key={figure.heading ?? figure.number}
                  figure={figure}
                />
              ))}
            </div>
          )}
          {slide.note && (
            <div className={styles.note}>
              <p className={styles.noteTitle}>{slide.note.title}</p>
              <p>{slide.note.text}</p>
            </div>
          )}
        </section>
      ))}
    </main>
  );
}
