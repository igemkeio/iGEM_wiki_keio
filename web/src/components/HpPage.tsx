import type { CSSProperties } from "react";

import type { Hp, HpInterview, HpUse, WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";
import {
  anchorId,
  isPlaceholder,
  isTentative,
  kindLabel,
  pivotOf,
  splitChapter4,
  whoOf4,
  colorOfUse,
  whenOf,
} from "../lib/hp";
import type { Chapter4 } from "../lib/hp";
import { notionBase } from "../lib/notionBase";
import { HpFigure1 } from "./HpFigure1";
import { HpFigure2 } from "./HpFigure2";

import styles from "./HpPage.module.css";

const html = (source: string) => ({
  __html: applyBase(source, import.meta.env.BASE_URL, notionBase),
});

const colorOf = (color: string) => ({ "--c": color }) as CSSProperties;

function Prose({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={`${className ?? ""} prose`}
      dangerouslySetInnerHTML={html(source)}
    />
  );
}

function Badge() {
  return <span className={styles.badge}>仮</span>;
}

// 面談の詳細。原稿がすでに折りたたみで始まっていればそのまま、そうでなければ折りたたみで包む。
function Detail({ source }: { source: string }) {
  if (source.trim() === "") {
    return null;
  }
  if (/^\s*<details[\s>]/u.test(source)) {
    return <Prose source={source} className={styles.detail} />;
  }
  return (
    <details className={styles.detailWrap}>
      <summary>詳細</summary>
      <Prose source={source} className={styles.detail} />
    </details>
  );
}

function Interview({
  interview,
  color,
}: {
  interview: HpInterview;
  color: string;
}) {
  const when = whenOf(interview.no);
  const tentative = isTentative(interview, when);
  const noContent =
    isPlaceholder(interview.purposeHtml) &&
    isPlaceholder(interview.takeHomeHtml);
  return (
    <div
      className={styles.row}
      id={anchorId(interview.no)}
      style={colorOf(color)}
    >
      <div className={styles.who}>
        <span className={styles.no}>{interview.no}</span>
        <b className={styles.person}>{interview.person}</b>
        {interview.affiliation && (
          <span className={styles.aff}>{interview.affiliation}</span>
        )}
        {when && (
          <>
            <div className={styles.meta}>{when.date}</div>
            <span className={`${styles.mode} ${styles[when.kind]}`}>
              {kindLabel(when)}
            </span>
          </>
        )}
      </div>
      <div className={tentative ? styles.tentative : undefined}>
        <h4 className={styles.rowTitle}>
          {interview.title}
          {tentative && <Badge />}
        </h4>
        {tentative && (
          <p className={styles.notice}>
            <b>原稿が未確定</b>
            {noContent
              ? "　目的とTake homeがまだ書かれていない。"
              : "　以下は仮の本文。"}
          </p>
        )}
        {!noContent && (
          <div className={styles.pair}>
            <div>
              <span className={styles.lab}>目的</span>
              <Prose source={interview.purposeHtml} className={styles.text} />
            </div>
            <div className={styles.take}>
              <span className={styles.lab}>Take home</span>
              <Prose source={interview.takeHomeHtml} className={styles.text} />
            </div>
          </div>
        )}
        <Detail source={interview.detailHtml} />
      </div>
    </div>
  );
}

function Use({ use }: { use: HpUse }) {
  const color = colorOfUse(use.no);
  const pivot = pivotOf(use.no);
  const subtitle = use.subtitle || pivot?.subtitle || "";
  return (
    <section
      className={styles.use}
      id={anchorId(use.no)}
      style={colorOf(color)}
    >
      <div className={styles.uhead}>
        <span className={styles.n}>
          {use.no}
          {subtitle && `　${subtitle}`}
        </span>
        <h3>{use.title}</h3>
        <span className={styles.count}>面談 {use.interviews.length}件</span>
      </div>
      <div className={styles.ubody}>
        <Prose source={use.introHtml} className={styles.uintro} />
        {pivot && (
          <>
            <div className={styles.pivot}>
              <div className={styles.p}>
                <span>聞く前の想定</span>
                <p>{pivot.before}</p>
              </div>
              <div className={styles.arrow} aria-hidden="true">
                →
              </div>
              <div className={`${styles.p} ${styles.after}`}>
                <span>聞いたあと</span>
                <p>{pivot.after}</p>
              </div>
            </div>
            <p className={styles.when}>変わった時期: {pivot.when}</p>
          </>
        )}
        <p className={styles.evid}>そう決めた根拠</p>
        {use.interviews.map((interview) => (
          <Interview key={interview.no} interview={interview} color={color} />
        ))}
        <div className={styles.conclusion}>
          <b>結論</b>
          {isPlaceholder(use.conclusionHtml) ? (
            <span className={styles.notice}>
              <b>仮</b>　原稿が未確定
            </span>
          ) : (
            <Prose source={use.conclusionHtml} />
          )}
        </div>
      </div>
    </section>
  );
}

function Chapter4Body({ chapter }: { chapter: Hp["chapter4"] }) {
  const parts: Chapter4 | null = splitChapter4(chapter.html);
  if (!parts) {
    return <Prose source={chapter.html} className={styles.dText} />;
  }
  return (
    <>
      {parts.leadHtml && (
        <Prose source={parts.leadHtml} className={styles.dText} />
      )}
      <div className={styles.g4}>
        {parts.cards.map((card, i) => {
          const empty = isPlaceholder(card.html);
          return (
            <div
              key={`${card.no}-${i}`}
              className={`${styles.it} ${card.group ? styles.group : ""} ${card.long ? styles.long : ""}`}
              id={card.no ? anchorId(card.no) : undefined}
            >
              {card.no && <span className={styles.itNo}>{card.no}</span>}
              <h4>
                {card.title}
                {!card.group && empty && <Badge />}
              </h4>
              {whoOf4(card.no) && (
                <p className={styles.who4}>{whoOf4(card.no)}</p>
              )}
              {!card.group && empty ? (
                <p className={styles.notice}>
                  <b>原稿が未確定</b>　本文がまだ書かれていない。
                </p>
              ) : (
                <Prose source={card.html} className={styles.dText} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// 目次の代わりに、上の帯で章と用途に飛ぶ。ヘッダーの下に貼り付く。
function Bar({ hp }: { hp: Hp }) {
  return (
    <nav className={styles.bar} aria-label="Human Practices">
      <span className={styles.bt}>HUMAN PRACTICES</span>
      <a href="#hp-c1">1章 方向性</a>
      {hp.chapter2.uses.map((use) => (
        <a
          key={use.no}
          href={`#${anchorId(use.no)}`}
          style={colorOf(colorOfUse(use.no))}
        >
          <i />
          {use.title}
        </a>
      ))}
      <a href="#hp-c4">4章 限界</a>
      <a className={styles.sp} href="#hp-fig2">
        図2 タイムライン
      </a>
    </nav>
  );
}

// 変化を主役にしたHuman Practicesの画面。hpがあるページだけで使い、htmlは出さない。
export function HpPage({ page, hp }: { page: WikiPage; hp: Hp }) {
  return (
    <main className={styles.root}>
      <Bar hp={hp} />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Human Practices</span>
        <h1>{page.title}</h1>
        {page.subtitle && <p className={styles.ja}>{page.subtitle}</p>}
        {page.lead && (
          <p
            className={styles.lead}
            dangerouslySetInnerHTML={html(page.lead)}
          />
        )}
        {hp.intro.trim() !== "" && (
          <details className={styles.introWrap}>
            <summary>iGEMの評価基準と概要</summary>
            <Prose source={hp.intro} className={styles.intro} />
          </details>
        )}
      </header>
      <HpFigure1 />
      <section className={`${styles.band} ${styles.grey}`} id="hp-c1">
        <div className={styles.chead}>
          <span className={styles.chapter}>Chapter 1</span>
          <h2>{hp.chapter1.title}</h2>
          <Prose source={hp.chapter1.introHtml} className={styles.cintro} />
        </div>
        {hp.chapter1.interviews.map((interview) => (
          <Interview
            key={interview.no}
            interview={interview}
            color="var(--color-muted)"
          />
        ))}
      </section>
      <section className={`${styles.band} ${styles.noBottom}`} id="hp-c2">
        <div className={styles.chead}>
          <span className={styles.chapter}>Chapter 2</span>
          <h2>{hp.chapter2.title}</h2>
          <Prose source={hp.chapter2.introHtml} className={styles.cintro} />
        </div>
      </section>
      {hp.chapter2.uses.map((use) => (
        <Use key={use.no} use={use} />
      ))}
      <section className={styles.dark} id="hp-c4">
        <div className={styles.chead}>
          <span className={styles.chapter}>Chapter 4</span>
          <h2>{hp.chapter4.title}</h2>
        </div>
        <Chapter4Body chapter={hp.chapter4} />
      </section>
      <section className={styles.band} id="hp-c0">
        <div className={styles.chead}>
          <span className={styles.chapter}>Chapter 0</span>
          <h2>{hp.chapter0.title}</h2>
        </div>
        <Prose source={hp.chapter0.html} className={styles.ment} />
      </section>
      <HpFigure2 />
    </main>
  );
}
