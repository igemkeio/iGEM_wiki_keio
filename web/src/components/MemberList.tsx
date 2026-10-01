import { useEffect, useId, useRef, useState } from "react";

import type { Locale } from "../content";
import members from "../data/members.json";

import styles from "./MemberList.module.css";

interface Localized {
  ja: string;
  en: string;
}

interface Member {
  id: string;
  name: Localized;
  role: string;
  department: Localized;
  year: number;
  tags: string[];
  bio: Localized;
  // static.igem.wikiのURL。無ければ写真を出さない。
  photo?: string;
}

const labels = {
  en: { close: "Close", year: (n: number) => `Year ${n}` },
  ja: { close: "閉じる", year: (n: number) => `${n}年` },
} as const;

// メンバーの一覧と、クリックで開く詳細のモーダル。
export function MemberList({
  locale = "en",
  list = members as Member[],
}: {
  locale?: Locale;
  list?: Member[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Member | null>(null);
  const t = labels[locale];

  const titleId = useId();
  // mousedownがdialog自身で始まったときだけ、続くclickをオーバーレイのクリックとみなす。
  const pressedOnBackdrop = useRef(false);

  useEffect(() => {
    if (selected && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [selected]);

  const open = (member: Member) => setSelected(member);
  const close = () => dialogRef.current?.close();

  return (
    <section className={styles.root}>
      <ul className={styles.list}>
        {list.map((member) => (
          <li key={member.id}>
            <button
              type="button"
              className={styles.card}
              onClick={() => open(member)}
            >
              {member.photo && (
                <img
                  className={styles.photo}
                  src={member.photo}
                  alt=""
                  loading="lazy"
                />
              )}
              <span className={styles.name}>{member.name[locale]}</span>
              <span className={styles.role}>{member.role}</span>
            </button>
          </li>
        ))}
      </ul>
      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- 背景のクリックで閉じる。キーボードはEscと閉じるボタンで閉じられる */}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={selected ? titleId : undefined}
        onMouseDown={(event) => {
          pressedOnBackdrop.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (
            pressedOnBackdrop.current &&
            event.target === event.currentTarget
          ) {
            close();
          }
          pressedOnBackdrop.current = false;
        }}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className={styles.panel}>
            <button type="button" className={styles.close} onClick={close}>
              {t.close}
            </button>
            {selected.photo && (
              <img className={styles.photo} src={selected.photo} alt="" />
            )}
            <h2 id={titleId} className={styles.dialogName}>
              {selected.name[locale]}
            </h2>
            <p className={styles.meta}>
              {selected.role} / {selected.department[locale]} /{" "}
              {t.year(selected.year)}
            </p>
            <p className={styles.tags}>{selected.tags.join(" / ")}</p>
            <p className={styles.bio}>{selected.bio[locale]}</p>
          </div>
        )}
      </dialog>
    </section>
  );
}

export default MemberList;
