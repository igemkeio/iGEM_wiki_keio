import type { WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";
import {
  dropDraft,
  splitAfterParagraph,
  splitCardList,
  splitDescription,
  splitHeading,
} from "../lib/descriptionSections";
import type { DescriptionSection } from "../lib/descriptionSections";
import { notionBase } from "../lib/notionBase";
import { ArticlePage } from "./ArticlePage";
import {
  AdhesionFigure,
  ChainFigure,
  DescriptionDefs,
  IntroFigure,
} from "./DescriptionFigures";

import styles from "./DescriptionPage.module.css";

interface Card {
  no: string;
  en: string;
  parts: string;
  viewBox: string;
  label: string;
  symbol: string;
}

const cards: Card[] = [
  {
    no: "①",
    en: "Split the poles",
    parts: "PopZ / DivIVA",
    viewBox: "190 180 500 300",
    label: "細胞の拡大。左極にPopZ、右極にDivIVAが局在する",
    symbol: "desc-cross",
  },
  {
    no: "②",
    en: "Choose the partner",
    parts: "Intimin–Ag ⇄ Intimin–Nb",
    viewBox: "120 180 500 300",
    label: "細胞の左側の拡大。PopZの局在と、外膜にAgが提示される様子",
    symbol: "desc-cross",
  },
  {
    no: "③",
    en: "Link at the pole",
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
  // 原稿のh3のid(前方一致)。
  idPrefix: string;
  field: string;
  one: string;
  className: string;
  icon: React.ReactNode;
}

const applications: Application[] = [
  {
    idPrefix: "bacterial-wires",
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
    idPrefix: "smart-bandages",
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
    idPrefix: "cascade-enzyme-pathways",
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
  // 原稿の下書きは画面に出さない。
  const shown: WikiPage = { ...page, html: dropDraft(page.html) };
  const parts = splitDescription(shown.html);
  const [intro, engineering, system, apps, conclusion] = parts?.sections ?? [];
  if (
    !parts ||
    parts.sections.length !== 5 ||
    system.subsections.length !== 3 ||
    apps.subsections.length !== 3
  ) {
    return <ArticlePage page={shown} />;
  }
  const cardList = splitCardList(system.body, cards.length);
  const bandApps = apps.subsections.map((sub) =>
    applications.find((app) => sub.id.startsWith(app.idPrefix))
  );
  if (
    !cardList ||
    bandApps.some((app) => !app) ||
    new Set(bandApps).size !== applications.length
  ) {
    return <ArticlePage page={shown} />;
  }

  const imgAt = intro.body.indexOf("<img");
  const introHead = imgAt === -1 ? intro.body : intro.body.slice(0, imgAt);
  const introTail = imgAt === -1 ? "" : intro.body.slice(imgAt);

  // 図2は、既存技術の説明(4段落)の直後、課題を述べる「すなわち」の段落の前に置く。
  const [engHead, engTail] = splitAfterParagraph(engineering.body, 4) ?? [
    engineering.body,
    "",
  ];

  const bandBodies = apps.subsections.map(
    (s) => splitAfterParagraph(s.body, 1) ?? [s.body, ""]
  );
  const appsTail = bandBodies.map(([, rest]) => rest).join("");

  const columns = Array.from(
    { length: Math.ceil(parts.message.length / 2) },
    (_, i) => parts.message.slice(i * 2, i * 2 + 2)
  );

  return (
    <main className={styles.main}>
      <DescriptionDefs />

      <div className={styles.hero}>
        <span id="project-description" className={styles.eyebrow}>
          {parts.eyebrow}
        </span>
        <h1 className={styles.visuallyHidden}>{page.title}</h1>
        <p className={styles.display}>ONE DIRECTION</p>
        <figure>
          <section
            className={styles.scrollx}
            aria-label="細胞3つの連結図"
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- キーボードで横にスクロールできるようにする
            tabIndex={0}
          >
            <ChainFigure />
          </section>
          <p className={styles.hintx}>横にスクロールできる</p>
        </figure>
        <div className={styles.msgline}>
          <span className={styles.eyebrow}>Message</span>
          {columns.map((col, i) => (
            // oxlint-disable-next-line react/no-array-index-key -- 並びの固定した静的な列
            <div key={i}>
              {col.map((p, j) => (
                <p
                  // oxlint-disable-next-line react/no-array-index-key -- 同文の段落があり得る
                  key={j}
                  className={p.emphasis ? styles.hi : undefined}
                  dangerouslySetInnerHTML={{ __html: p.html }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <section>
        <Sbar no={1} section={intro} />
        <Prose html={introHead} className={styles.bodyTop} />
        <figure className={styles.plate}>
          <IntroFigure />
          <figcaption className={styles.caption}>
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
          <figcaption className={styles.caption}>
            図2　既存の接着技術が決められること（左）と、残っている自由度（右）。
          </figcaption>
        </figure>
        <Prose html={engTail} />
      </section>

      <section>
        <Sbar no={3} section={system} />
        <Prose html={cardList.before} className={styles.bodyTop} />
        <div className={styles.plates}>
          {cards.map((card, i) => (
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
                <h3>{cardList.items[i].heading}</h3>
                <p>{cardList.items[i].text}</p>
                <p className={styles.parts}>{card.parts}</p>
              </div>
            </article>
          ))}
        </div>
        <Prose html={cardList.after} className={styles.afterPlates} />
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
                    {stepMarks[i]} {title.replace(/^(Step \d)\.\s*/u, "$1 — ")}
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
            const app = bandApps[i] as Application;
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
    </main>
  );
}
