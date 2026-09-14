"use client";

import { useState } from "react";
import membersData from "@/data/members.json";
import type { Locale } from "@/lib/wiki";

type LocalizedText = { ja: string; en: string };

type Member = {
  id: string;
  name: LocalizedText;
  role: string;
  department: LocalizedText;
  year: number;
  status?: Partial<LocalizedText>;
  tags?: string[];
  bio: LocalizedText;
};

const members = membersData as Member[];

// 表示用の文言。Homepage 版は日本語決め打ちだが、wiki は en / ja 両方あるので切り替える。
const LABELS = {
  ja: { heading: "メンバー", detail: "学年・学科", close: "閉じる", photoAlt: "の写真" },
  en: { heading: "Members", detail: "Year / Department", close: "Close", photoAlt: "'s photo" },
} as const;

function focusText(member: Member, locale: Locale): string {
  const status = member.status?.[locale] ? ` ${member.status[locale]}` : "";
  const year = locale === "ja" ? `${member.year}年` : `Year ${member.year}`;
  return `${year}${status} / ${member.department[locale]}`;
}

function profileImage(memberId: string): string {
  return `/people/${memberId}/profile.jpg`;
}

export default function MemberList({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState<Member | null>(null);
  const t = LABELS[locale];
  const closeModal = () => setSelected(null);

  return (
    <section className="member-section">
      <h2>{t.heading}</h2>
      <div className="member-grid">
        {members.map((member) => (
          <button
            className="member-card"
            key={member.id}
            type="button"
            onClick={() => setSelected(member)}
          >
            <div
              className="member-card__avatar"
              aria-hidden="true"
              style={{ backgroundImage: `url(${profileImage(member.id)})` }}
            />
            <div className="member-card__body">
              <p className="member-card__role">{member.role}</p>
              <h4 className="member-card__name">{member.name[locale]}</h4>
              <p className="member-card__focus">{focusText(member, locale)}</p>
              {member.tags && (
                <div className="member-card__tags">
                  {member.tags.map((tag) => (
                    <span className="member-card__tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="member-modal" role="dialog" aria-modal="true">
          <div className="member-modal__backdrop" onClick={closeModal} />
          <div className="member-modal__content">
            <button className="member-modal__close" onClick={closeModal} aria-label={t.close}>
              ×
            </button>
            <div className="member-modal__header">
              <div
                className="member-card__avatar"
                aria-hidden="true"
                style={{ backgroundImage: `url(${profileImage(selected.id)})` }}
              />
              <div>
                <p className="member-card__role">{selected.role}</p>
                <h3 className="member-modal__name">{selected.name[locale]}</h3>
              </div>
            </div>
            <div className="member-modal__layout">
              <div className="member-modal__info">
                <dl className="member-modal__details">
                  <div>
                    <dt>{t.detail}</dt>
                    <dd>{focusText(selected, locale)}</dd>
                  </div>
                </dl>
                <p className="member-modal__bio">{selected.bio[locale]}</p>
                {selected.tags && (
                  <div className="member-card__tags">
                    {selected.tags.map((tag) => (
                      <span className="member-card__tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="member-modal__photo">
                <img
                  src={profileImage(selected.id)}
                  alt={`${selected.name[locale]}${t.photoAlt}`}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
