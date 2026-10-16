import { Fragment } from "react";
import type { CSSProperties } from "react";

import type { Dbtl, DbtlCycle, Locale, WikiPage } from "../content";
import { applyBase } from "../lib/applyBase";
import {
  allCycles,
  cycleMark,
  dbtlText,
  PHASES,
  stripLeadingHeading,
  toSummary,
} from "../lib/dbtl";
import DbtlStage from "./DbtlStage";
import { Island } from "./Island";

import styles from "./DbtlPage.module.css";

const html = (source: string) => ({
  __html: applyBase(source, import.meta.env.BASE_URL),
});

// 箱の中の1サイクル。節はlib/dbtl.tsのbuildStopsと同じ順に並べる。
function Cycle({ cycle, locale }: { cycle: DbtlCycle; locale: Locale }) {
  const t = dbtlText(locale);
  const mark = cycleMark(cycle.no);
  const last = cycle.iterations.length - 1;
  return (
    <article className={styles.cycle}>
      <section
        className={styles.intro}
        data-dbtl-stop=""
        id={`dbtl-cycle-${cycle.no}`}
      >
        <p className={styles.eyebrow}>
          {t.layer[cycle.layer]} / {t.cycle(mark)}
        </p>
        <h2 className={styles.cycleTitle}>{cycle.title}</h2>
        <p className={styles.tagline}>{cycle.tagline}</p>
        {cycle.leadHtml && (
          <div
            className={`${styles.lead} prose`}
            dangerouslySetInnerHTML={html(cycle.leadHtml)}
          />
        )}
        <div
          className={`${styles.text} prose`}
          dangerouslySetInnerHTML={html(cycle.whyHtml)}
        />
        <dl className={styles.summary}>
          <dt>{t.hypothesis}</dt>
          <dd dangerouslySetInnerHTML={html(cycle.hypothesis)} />
          <dt>{t.criteria}</dt>
          <dd dangerouslySetInnerHTML={html(cycle.criteria)} />
        </dl>
      </section>
      {cycle.iterations.map((iteration, i) => (
        <Fragment key={iteration.no}>
          <section className={styles.focus} data-dbtl-stop="">
            <p className={styles.no}>
              {t.iteration} {iteration.no} / {cycle.iterations.length}
            </p>
            <h3 className={styles.focusTitle}>{iteration.title}</h3>
            <dl className={styles.summary}>
              <dt>{t.aim}</dt>
              <dd dangerouslySetInnerHTML={html(iteration.design)} />
              <dt>{t.reached}</dt>
              <dd
                className={styles.learn}
                dangerouslySetInnerHTML={html(iteration.learn)}
              />
            </dl>
            <p className={styles.go}>↓ {t.readFrom}</p>
          </section>
          {PHASES.map((phase, j) => (
            <section
              key={phase}
              className={styles.phase}
              style={
                {
                  "--dbtl-phase": `var(--color-dbtl-${phase})`,
                } as CSSProperties
              }
              data-dbtl-stop=""
            >
              <p className={styles.phaseName}>{phase.toUpperCase()}</p>
              {j === 0 && i > 0 && (
                <p className={styles.quote}>
                  <b>↩ {t.prevLearn}</b>
                  <span
                    dangerouslySetInnerHTML={html(
                      cycle.iterations[i - 1].learn
                    )}
                  />
                </p>
              )}
              <div
                className={`${styles.text} prose`}
                dangerouslySetInnerHTML={html(iteration[phase])}
              />
            </section>
          ))}
          <section className={styles.lap} data-dbtl-stop="">
            <p className={styles.cap}>
              {t.iteration} {iteration.no} {t.complete}
            </p>
            <div
              className={`${styles.lapSum} prose`}
              dangerouslySetInnerHTML={html(iteration.learn)}
            />
            {iteration.notesHtml && (
              <div
                className={`${styles.notes} prose`}
                dangerouslySetInnerHTML={html(iteration.notesHtml)}
              />
            )}
            <p className={styles.next}>
              {i < last
                ? `↓ ${t.nextIteration(cycle.iterations[i + 1].no)}`
                : t.cycleComplete}
            </p>
          </section>
        </Fragment>
      ))}
      <section className={styles.outcomes} data-dbtl-stop="">
        <h3 className={styles.outcomesTitle}>{t.outcomes}</h3>
        <div
          className={`${styles.text} prose`}
          dangerouslySetInnerHTML={html(cycle.outcomesHtml)}
        />
      </section>
      <section className={styles.handoff} data-dbtl-stop="">
        <p className={styles.cap}>{t.handoff}</p>
        <div
          className={`${styles.text} prose`}
          dangerouslySetInnerHTML={html(cycle.handoffHtml)}
        />
      </section>
    </article>
  );
}

// dbtlのあるページ。intro、DBTLのステージ、outroの順に並べる。
export function DbtlPage({ page, dbtl }: { page: WikiPage; dbtl: Dbtl }) {
  const props = {
    locale: page.locale,
    cycles: allCycles(dbtl).map(toSummary),
  };
  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>{page.title}</h1>
        {page.subtitle && <p className={styles.subtitle}>{page.subtitle}</p>}
      </div>
      {page.lead && (
        <p
          className={styles.pageLead}
          dangerouslySetInnerHTML={html(page.lead)}
        />
      )}
      <div
        className={`${styles.body} prose`}
        dangerouslySetInnerHTML={html(stripLeadingHeading(dbtl.intro))}
      />
      <section className={styles.stage} id="dbtl-stage">
        <Island name="dbtl-stage" props={props}>
          <DbtlStage {...props} />
        </Island>
        <div className={styles.box} id="dbtl-box">
          {dbtl.parts.map((part) => (
            <Fragment key={part.label}>
              <header className={styles.part}>
                <p className={styles.eyebrow}>{part.label}</p>
                <p className={styles.partTitle}>{part.title}</p>
                <div
                  className={`${styles.text} prose`}
                  dangerouslySetInnerHTML={html(part.introHtml)}
                />
              </header>
              {part.cycles.map((cycle) => (
                <Cycle key={cycle.no} cycle={cycle} locale={page.locale} />
              ))}
            </Fragment>
          ))}
          <div className={styles.end} />
        </div>
      </section>
      <div
        className={`${styles.body} prose`}
        dangerouslySetInnerHTML={html(dbtl.outro)}
      />
    </main>
  );
}
