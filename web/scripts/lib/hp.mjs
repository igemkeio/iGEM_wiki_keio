// Human Practices の原稿HTMLから章・用途・面談を読み取る。形式は content/README.md の hp。

const VOID_TAGS = new Set(["hr", "br", "img", "input", "wbr"]);

// silent が true のときは構造そのものが無い(読み取り対象でない)ことを表し、呼び出し側で警告にしない。
class HpError extends Error {
  constructor(message, { silent = false } = {}) {
    super(message);
    this.name = "HpError";
    this.silent = silent;
  }
}

const broken = (message) => new HpError(message);

function decodeEntities(text) {
  return text
    .replaceAll(/&#(\d+);/gu, (_, n) => String.fromCodePoint(Number(n)))
    .replaceAll(/&#x([0-9a-f]+);/giu, (_, n) =>
      String.fromCodePoint(Number.parseInt(n, 16))
    )
    .replaceAll("&nbsp;", " ")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

// タグと、太字の残骸の ** を除き、空白(全角を含む)を半角1つにまとめる。
function textOf(html) {
  return decodeEntities(html.replaceAll(/<[^>]*>/gu, ""))
    .replaceAll("**", "")
    .replaceAll(/\s+/gu, " ")
    .trim();
}

function makeBlock(tag, html) {
  return { tag, html, text: textOf(html) };
}

// 最上位の要素ごとに分ける。同じ深さに並ぶ要素が1ブロック。
function splitBlocks(html) {
  const blocks = [];
  const tokens = html.matchAll(
    /<!--[\s\S]*?-->|<(\/?)([a-z][a-z0-9]*)\b[^>]*>/giu
  );
  let depth = 0;
  let start = 0;
  let last = 0;
  for (const token of tokens) {
    const [raw, closing, name] = token;
    if (!name) {
      continue;
    }
    const tag = name.toLowerCase();
    if (depth === 0) {
      start = token.index;
    }
    if (VOID_TAGS.has(tag) || raw.endsWith("/>")) {
      if (depth === 0) {
        blocks.push(
          makeBlock(tag, html.slice(start, token.index + raw.length))
        );
      }
    } else if (closing) {
      depth -= 1;
      if (depth === 0) {
        blocks.push(
          makeBlock(tag, html.slice(start, token.index + raw.length))
        );
      }
    } else {
      depth += 1;
    }
    last = token.index + raw.length;
  }
  if (depth !== 0 || html.slice(last).trim() !== "") {
    throw broken(
      "HTML のタグが閉じていないか、最上位に要素でない本文があります"
    );
  }
  return blocks;
}

const joinHtml = (blocks) => blocks.map((block) => block.html).join("\n");

// 全角の数字・英字・ピリオドを半角にする。
const toHalf = (text) =>
  text
    .replaceAll(/[０-９Ａ-Ｚａ-ｚ]/gu, (c) =>
      String.fromCodePoint(c.codePointAt(0) - 0xfee0)
    )
    .replaceAll("．", ".");

const NUM = "[0-9０-９]+";
const DOT = "[.．]";
const CHAPTER_0 = /^[0０]\s*章\s*(.*)$/u;
const CHAPTER_1 = /^[1１]\s*章\s*(.*)$/u;
const CHAPTER_2 = /^[2２]\s*章\s*(.*)$/u;
const CHAPTER_4 = /^[4４]\s*章\s*(.*)$/u;
const CH1_INTERVIEW = new RegExp(
  `^[1１]${DOT}(${NUM})(?![.．0-9０-９])\\s*(.*)$`,
  "u"
);
const USE_HEADING = new RegExp(
  `^[2２]${DOT}(${NUM})(?![.．0-9０-９])\\s*(.*)$`,
  "u"
);
const USE_INTERVIEW = new RegExp(
  `^[2２]${DOT}(${NUM})${DOT}([A-Za-zＡ-Ｚａ-ｚ])\\s*(.*)$`,
  "u"
);
const CONCLUSION = /^結論$/u;
const PURPOSE = /^目的$/u;
const TAKE_HOME = /^take[\s-]?home/iu;
const NAME_SUFFIX = /(?:先生|さん|氏)$/u;
const LATIN_NAME = /^[A-Za-z\u00C0-\u024F.-]+$/u;
const NAME_THEN_REST = /^(.*?(?:先生|さん|氏))[\s・]+(.+)$/u;
const TRAILING_PAREN = /^(.*?)\s*[（(]([^（()）]*)[）)]$/u;

const isH2 = (block) => block.tag === "h2";

// 末尾の括弧を (括弧の前, 括弧の中) に分ける。括弧が無いときは中が空。
function splitTrailingParen(text) {
  const match = TRAILING_PAREN.exec(text);
  return match
    ? { head: match[1].trim(), inner: match[2].trim() }
    : { head: text, inner: "" };
}

// 括弧の中から人名と所属を取る。取れなければ空。
function parsePersonAffiliation(inner) {
  const parts = inner.split(/[\s・]+/u).filter((part) => part !== "");
  if (
    parts.length === 2 &&
    LATIN_NAME.test(parts[0]) &&
    NAME_SUFFIX.test(parts[1])
  ) {
    return { person: parts.join(" "), affiliation: "" };
  }
  if (parts.length === 2) {
    return { person: parts[0], affiliation: parts[1] };
  }
  if (parts.length === 1) {
    return NAME_SUFFIX.test(parts[0])
      ? { person: parts[0], affiliation: "" }
      : { person: "", affiliation: parts[0] };
  }
  const match = NAME_THEN_REST.exec(inner);
  return match
    ? { person: match[1], affiliation: match[2] }
    : { person: "", affiliation: "" };
}

// 面談の節の中身を、目的・Take home・それ以外(サブパート以降)に分ける。サブパートは h3 か、折りたたみ(details)で始まる。
function parseInterviewBody(blocks) {
  const sections = { purpose: [], takeHome: [], detail: [] };
  let current = "detail";
  for (const block of blocks) {
    if (block.tag === "h3") {
      if (PURPOSE.test(block.text)) {
        current = "purpose";
        continue;
      }
      if (TAKE_HOME.test(block.text)) {
        current = "takeHome";
        continue;
      }
      current = "detail";
    } else if (block.tag === "details") {
      current = "detail";
    }
    sections[current].push(block);
  }
  return {
    purposeHtml: joinHtml(sections.purpose),
    takeHomeHtml: joinHtml(sections.takeHome),
    detailHtml: joinHtml(sections.detail),
  };
}

function buildInterview(no, rest, body) {
  const { head, inner } = splitTrailingParen(rest);
  const interview = {
    no,
    title: head,
    ...parsePersonAffiliation(inner),
    ...parseInterviewBody(body),
  };
  if (rest.includes("XXX")) {
    interview.draft = true;
  }
  return interview;
}

// h2 の位置で区切って、見出しごとの本文ブロックを返す。最初の h2 より前は lead。
function sectionsByH2(blocks) {
  const lead = [];
  const sections = [];
  for (const block of blocks) {
    if (isH2(block)) {
      sections.push({ heading: block, body: [] });
    } else if (sections.length === 0) {
      lead.push(block);
    } else {
      sections.at(-1).body.push(block);
    }
  }
  return { lead, sections };
}

function parseChapter1(blocks) {
  const { lead, sections } = sectionsByH2(blocks);
  const interviews = sections.map(({ heading, body }) => {
    const match = CH1_INTERVIEW.exec(heading.text);
    if (!match) {
      throw broken(
        `1章: 面談の見出しから番号(1.1 など)が取れません: ${heading.text.slice(0, 40)}`
      );
    }
    return buildInterview(`1.${toHalf(match[1])}`, match[2], body);
  });
  if (interviews.length === 0) {
    throw broken("1章: 面談がありません");
  }
  return { introHtml: joinHtml(lead), interviews };
}

function parseChapter2(blocks) {
  const { lead, sections } = sectionsByH2(blocks);
  const uses = [];
  let concluded = false;
  for (const { heading, body } of sections) {
    const interviewMatch = USE_INTERVIEW.exec(heading.text);
    const useMatch = interviewMatch ? null : USE_HEADING.exec(heading.text);
    if (useMatch) {
      const { head, inner } = splitTrailingParen(useMatch[2]);
      uses.push({
        no: `2.${toHalf(useMatch[1])}`,
        title: head,
        subtitle: inner,
        introHtml: joinHtml(body),
        interviews: [],
        conclusionHtml: "",
      });
      concluded = false;
    } else if (interviewMatch) {
      const use = uses.at(-1);
      const useNo = `2.${toHalf(interviewMatch[1])}`;
      if (!use || use.no !== useNo || concluded) {
        throw broken(
          `2章: 面談が属する用途の見出しの後にありません: ${heading.text.slice(0, 40)}`
        );
      }
      use.interviews.push(
        buildInterview(
          `${useNo}.${toHalf(interviewMatch[2]).toUpperCase()}`,
          interviewMatch[3],
          body
        )
      );
    } else if (CONCLUSION.test(heading.text) && uses.length > 0 && !concluded) {
      uses.at(-1).conclusionHtml = joinHtml(body);
      concluded = true;
    } else {
      throw broken(
        `2章: 用途・面談・結論として読み取れない見出しがあります: ${heading.text.slice(0, 40)}`
      );
    }
  }
  if (uses.length === 0) {
    throw broken("2章: 用途がありません");
  }
  const empty = uses.find((use) => use.interviews.length === 0);
  if (empty) {
    throw broken(`2章: ${empty.no} に面談がありません`);
  }
  return { introHtml: joinHtml(lead), uses };
}

const chapterTitle = (block, pattern) => pattern.exec(block.text)[1].trim();

// 章のアンカー(0章・1章・2章・4章の h2)の位置を探す。1つでも無ければ構造化された原稿ではない。
function findAnchors(blocks) {
  const patterns = [CHAPTER_0, CHAPTER_1, CHAPTER_2, CHAPTER_4];
  const indexes = patterns.map((pattern) =>
    blocks.findIndex((block) => isH2(block) && pattern.test(block.text))
  );
  if (indexes.includes(-1)) {
    throw new HpError("章の見出しが揃っていません", { silent: true });
  }
  if (indexes.some((at, i) => i > 0 && at <= indexes[i - 1])) {
    throw broken("0章・1章・2章・4章の見出しの順序が崩れています");
  }
  return indexes;
}

function parseBlocks(blocks) {
  const [at0, at1, at2, at4] = findAnchors(blocks);
  const chapter0Body = blocks.slice(at0 + 1, at1);
  if (chapter0Body.length === 0) {
    throw broken("0章: 本文がありません");
  }
  const chapter4Body = blocks.slice(at4 + 1);
  if (chapter4Body.length === 0) {
    throw broken("4章: 本文がありません");
  }
  return {
    intro: joinHtml(blocks.slice(0, at0)),
    chapter0: {
      title: chapterTitle(blocks[at0], CHAPTER_0),
      html: joinHtml(chapter0Body),
    },
    chapter1: {
      title: chapterTitle(blocks[at1], CHAPTER_1),
      ...parseChapter1(blocks.slice(at1 + 1, at2)),
    },
    chapter2: {
      title: chapterTitle(blocks[at2], CHAPTER_2),
      ...parseChapter2(blocks.slice(at2 + 1, at4)),
    },
    chapter4: {
      title: chapterTitle(blocks[at4], CHAPTER_4),
      html: joinHtml(chapter4Body),
    },
  };
}

// 読み取れたときは { hp }、構造が無いときは { hp: null }、崩れているときは { hp: null, warning } を返す。
export function readHp(html) {
  try {
    return { hp: parseBlocks(splitBlocks(html)) };
  } catch (error) {
    if (!(error instanceof HpError)) {
      throw error;
    }
    return error.silent ? { hp: null } : { hp: null, warning: error.message };
  }
}
