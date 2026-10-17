import type { WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";
import {
  splitAfterParagraph,
  splitDescription,
  splitHeading,
} from "../lib/descriptionSections";
import type { DescriptionSection } from "../lib/descriptionSections";
import { notionBase } from "../lib/notionBase";
import { buildToc } from "../lib/toc";
import { ArticlePage } from "./ArticlePage";
import {
  AdhesionFigure,
  ChainFigure,
  DescriptionDefs,
  IntroFigure,
} from "./DescriptionFigures";
import { Toc } from "./Toc";

import styles from "./DescriptionPage.module.css";

interface Card {
  no: string;
  en: string;
  heading: string;
  text: string;
  parts: string;
  viewBox: string;
  label: string;
  symbol: string;
}

const cards: Card[] = [
  {
    no: "①",
    en: "Split the poles",
    heading: "細胞の向きを定義すること。",
    text: "2つの細胞極を異なる機能を持つ領域として区別する。",
    parts: "PopZ / DivIVA",
    viewBox: "190 180 500 300",
    label: "両極の拡大。左にPopZ、右にDivIVA",
    symbol: "desc-cross",
  },
  {
    no: "②",
    en: "Choose the partner",
    heading: "それぞれの極に接着機能を与えること。",
    text: "細胞極の位置情報を利用し、対応する接着分子を細胞表面に配置する。",
    parts: "Intimin–Ag ⇄ Intimin–Nb",
    viewBox: "120 180 500 300",
    label: "左極の拡大。コイルドコイルを経て外膜にAgが提示される",
    symbol: "desc-cross",
  },
  {
    no: "③",
    en: "Link at the pole",
    heading: "定義した方向に従って細胞をつなげること。",
    text: "極ごとに異なる接着特異性を利用し、細胞の相対的な向きを制御する。",
    parts: "CoilE × CoilR",
    viewBox: "160 20 500 300",
    label: "接合部の拡大。AgとNbがかみ合う",
    symbol: "desc-chain",
  },
];

// Step 1〜3の見出しの左に出す小さな分解図。カードと同じ絵、同じviewBox。
const stepThumbs = cards.map(({ viewBox, symbol }) => ({ viewBox, symbol }));
const stepMarks = ["①", "②", "③"];

interface Application {
  field: string;
  one: string;
  className: string;
  icon: React.ReactNode;
}

const applications: Application[] = [
  {
    field: "エネルギー",
    one: "信号を一方向に伝える、生きた配線。",
    className: styles.bandWire,
    icon: (
      <>
        <path
          d="M6 28 H50"
          stroke="#fff"
          strokeWidth="3"
          strokeDasharray="7 5"
        />
        <path d="M42 21 l8 7 -8 7" fill="none" stroke="#fff" strokeWidth="3" />
      </>
    ),
  },
  {
    field: "材料",
    one: "必要なものを、決まった向きに届ける。",
    className: styles.bandBandage,
    icon: (
      <>
        <rect
          x="6"
          y="18"
          width="44"
          height="20"
          rx="10"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
        />
        <path d="M14 28 H40" stroke="#fff" strokeWidth="3" />
        <path d="M35 23 l6 5 -6 5" fill="none" stroke="#fff" strokeWidth="3" />
      </>
    ),
  },
  {
    field: "製造",
    one: "反応の順番を、細胞の並びで決める。",
    className: styles.bandCascade,
    icon: (
      <>
        <g fill="none" stroke="#fff" strokeWidth="2.5">
          <circle cx="12" cy="28" r="7" />
          <circle cx="28" cy="28" r="7" />
          <circle cx="44" cy="28" r="7" />
        </g>
        <path d="M19 28 h2 M35 28 h2" stroke="#fff" strokeWidth="3" />
      </>
    ),
  },
];

const fix = (html: string) =>
  applyBase(html, import.meta.env.BASE_URL, notionBase);

function Prose({ html, className }: { html: string; className?: string }) {
  if (html.trim() === "") {
    return null;
  }
  return (
    <div
      className={`${styles.narrow} ${className ?? ""} prose`}
      dangerouslySetInnerHTML={{ __html: fix(html) }}
    />
  );
}

function Sbar({
  no,
  section,
}: {
  no: number;
  section: Pick<DescriptionSection, "id" | "heading">;
}) {
  const { title, sub } = splitHeading(section.heading);
  return (
    <div className={styles.sbar}>
      <div className={styles.no}>{String(no).padStart(2, "0")}</div>
      <h2 id={section.id}>
        {title}
        {sub && <span>{sub}</span>}
      </h2>
    </div>
  );
}

function Zoom({
  viewBox,
  label,
  symbol,
}: Pick<Card, "viewBox" | "symbol"> & {
  label?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true })}
    >
      <use href={`#${symbol}`} />
    </svg>
  );
}

// 日本語版のDescription。原稿htmlを節に切り分け、分解図の枠に流し込む。形が想定と違えばArticlePageで出す。
export function DescriptionPage({ page }: { page: WikiPage }) {
  const parts = splitDescription(page.html);
  const [intro, engineering, system, apps, conclusion] = parts?.sections ?? [];
  if (
    !parts ||
    parts.sections.length !== 5 ||
    system.subsections.length !== 3 ||
    apps.subsections.length !== 3
  ) {
    return <ArticlePage page={page} />;
  }

  const imgAt = intro.body.indexOf("<img");
  const introHead = imgAt === -1 ? intro.body : intro.body.slice(0, imgAt);
  const introTail = imgAt === -1 ? "" : intro.body.slice(imgAt);

  const [engHead, engTail] = splitAfterParagraph(engineering.body, 4) ?? [
    engineering.body,
    "",
  ];

  const olMatch = /<ol\b[\s\S]*?<\/ol>/u.exec(system.body);
  const sysHead = olMatch ? system.body.slice(0, olMatch.index) : system.body;
  const sysTail = olMatch
    ? system.body.slice(olMatch.index + olMatch[0].length)
    : "";

  const bandBodies = apps.subsections.map(
    (s) => splitAfterParagraph(s.body, 1) ?? [s.body, ""]
  );
  const appsTail = bandBodies.map(([, rest]) => rest).join("");

  const columns = [0, 2, 4].map((i) => parts.message.slice(i, i + 2));

  return (
    <>
      <Toc items={buildToc(page.html)} locale={page.locale} />
      <main className={styles.main}>
        <DescriptionDefs />

        <header className={styles.hero}>
          <span className={styles.eyebrow}>{parts.eyebrow}</span>
          <h1>ONE DIRECTION</h1>
          <figure>
            <div className={styles.scrollx}>
              <ChainFigure />
            </div>
            <p className={styles.hintx}>横にスクロールできる</p>
          </figure>
          <div className={styles.msgline}>
            <span className={styles.eyebrow}>Message</span>
            {columns.map((col) => (
              <div key={col[0]?.html}>
                {col.map((p) => (
                  <p
                    key={p.html}
                    className={p.emphasis ? styles.hi : undefined}
                    dangerouslySetInnerHTML={{ __html: p.html }}
                  />
                ))}
              </div>
            ))}
          </div>
        </header>

        <section>
          <Sbar no={1} section={intro} />
          <Prose html={introHead} className={styles.bodyTop} />
          <figure className={styles.plate}>
            <IntroFigure />
            <figcaption>
              図1　同じ部品でも、向きがそろうかどうかで系の働きは変わる。
            </figcaption>
          </figure>
          <Prose html={introTail} />
        </section>

        <section>
          <Sbar no={2} section={engineering} />
          <Prose html={engHead} className={styles.bodyTop} />
          <figure className={styles.plate}>
            <AdhesionFigure />
            <figcaption>
              図2　既存の接着技術が決められること（左）と、残っている自由度（右）。
            </figcaption>
          </figure>
          <Prose html={engTail} />
        </section>

        <section>
          <Sbar no={3} section={system} />
          <Prose html={sysHead} className={styles.bodyTop} />
          <div className={styles.plates}>
            {cards.map((card) => (
              <article key={card.no} className={styles.plate3}>
                <div className={styles.zoom}>
                  <Zoom
                    viewBox={card.viewBox}
                    label={card.label}
                    symbol={card.symbol}
                  />
                </div>
                <div className={styles.tx}>
                  <span className={styles.cardNo}>{card.no}</span>
                  <span className={styles.en3}>{card.en}</span>
                  <h3>{card.heading}</h3>
                  <p>{card.text}</p>
                  <p className={styles.parts}>{card.parts}</p>
                </div>
              </article>
            ))}
          </div>
          <Prose html={sysTail} className={styles.afterPlates} />
          {system.subsections.map((step, i) => {
            const { title, sub } = splitHeading(step.heading);
            return (
              <div key={step.id} className={styles.stepblock}>
                <div className={styles.stephead}>
                  <div className={styles.mini}>
                    <Zoom {...stepThumbs[i]} />
                  </div>
                  <div>
                    <b>
                      {stepMarks[i]}{" "}
                      {title.replace(/^(Step \d)\.\s*/u, "$1 — ")}
                    </b>
                    <h3 id={step.id}>{sub ?? title}</h3>
                  </div>
                </div>
                <Prose html={step.body} />
              </div>
            );
          })}
        </section>

        <section>
          <Sbar no={4} section={apps} />
          <Prose html={apps.body} className={styles.bodyTop} />
          <div className={styles.bands}>
            {apps.subsections.map((sub, i) => {
              const { title, sub: name } = splitHeading(sub.heading);
              const app = applications[i];
              return (
                <div key={sub.id} className={`${styles.band} ${app.className}`}>
                  <div className={styles.bandIn}>
                    <div className={styles.ico}>
                      <svg viewBox="0 0 56 56" aria-hidden="true">
                        {app.icon}
                      </svg>
                    </div>
                    <div>
                      <span className={styles.bn}>
                        {title} — {app.field}
                      </span>
                      <h3 id={sub.id}>{name ?? title}</h3>
                      <p className={styles.one}>{app.one}</p>
                    </div>
                    <div
                      className={styles.desc}
                      dangerouslySetInnerHTML={{
                        __html: fix(bandBodies[i][0]),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Prose html={appsTail} className={styles.afterPlates} />
        </section>

        <section>
          <Sbar no={5} section={conclusion} />
          <Prose html={conclusion.body} className={styles.bodyTop} />
        </section>

        {parts.refs.length > 0 && (
          <section className={styles.refs}>
            <h3 id="参考文献">参考文献</h3>
            <ol>
              {parts.refs.map((ref) => (
                <li key={ref} dangerouslySetInnerHTML={{ __html: ref }} />
              ))}
            </ol>
          </section>
        )}

        {parts.rest !== "" && (
          <div
            className={`${styles.rest} prose`}
            dangerouslySetInnerHTML={{ __html: fix(parts.rest) }}
          />
        )}
      </main>
    </>
  );
}
