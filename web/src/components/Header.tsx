import Link from "next/link";
import type { Locale } from "@/lib/wiki";

type Group = { label: string; items: { slug: string; label: string }[] };

const GROUPS: Group[] = [
  {
    label: "Project",
    items: [
      { slug: "description", label: "Description" },
      { slug: "application", label: "Application" },
      { slug: "engineering", label: "Engineering" },
      { slug: "contribution", label: "Contribution" },
      { slug: "judging", label: "Judging" },
    ],
  },
  {
    label: "Wet Lab",
    items: [
      { slug: "design", label: "Design" },
      { slug: "experiments", label: "Experiments" },
      { slug: "measurement", label: "Measurement" },
      { slug: "results", label: "Results" },
    ],
  },
  {
    label: "Dry Lab",
    items: [{ slug: "model", label: "Model" }],
  },
  {
    label: "Human Practices",
    items: [
      { slug: "human-practices", label: "IHP" },
      { slug: "education", label: "Education" },
    ],
  },
  {
    label: "Team",
    items: [
      { slug: "members", label: "Members" },
      { slug: "attributions", label: "Attributions" },
    ],
  },
];

function href(locale: Locale, slug: string): string {
  if (slug === "home") return locale === "ja" ? "/ja/" : "/";
  return locale === "ja" ? `/ja/${slug}/` : `/${slug}/`;
}

export default function Header({ locale, currentSlug }: { locale: Locale; currentSlug: string }) {
  const otherLangHref =
    locale === "ja"
      ? currentSlug === "home"
        ? "/"
        : `/${currentSlug}/`
      : currentSlug === "home"
        ? "/ja/"
        : `/ja/${currentSlug}/`;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <Link className="navbar-brand" href={href(locale, "home")}>
          iGEM Keio
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ml-auto left-aligned">
            <li className="nav-item">
              <Link className="nav-link" href={href(locale, "home")}>
                Home
              </Link>
            </li>
            {GROUPS.map((g) => (
              <li className="nav-item dropdown" key={g.label}>
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {g.label}
                </a>
                <ul className="dropdown-menu">
                  {g.items.map((it) => (
                    <li key={it.slug}>
                      <Link className="dropdown-item" href={href(locale, it.slug)}>
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                🌐 Language
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" href={locale === "en" ? "#" : otherLangHref}>
                    English
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href={locale === "ja" ? "#" : otherLangHref}>
                    日本語
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
