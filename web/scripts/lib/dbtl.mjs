// Engineering の原稿HTMLからDBTLのサイクルと反復を読み取る。形式は content/README.md の dbtl。

const VOID_TAGS = new Set(["hr", "br", "img", "input", "wbr"]);
const CIRCLED = "①②③④⑤⑥";
const LAYERS = { 基盤: "base", 設計: "design" };
const DBTL_HEADERS = ["DESIGN", "BUILD", "TEST", "LEARN"];

// silent が true のときは構造そのものが無い(読み取り対象でない)ことを表し、呼び出し側で警告にしない。
class DbtlError extends Error {
  constructor(message, { silent = false } = {}) {
    super(message);
    this.name = "DbtlError";
    this.silent = silent;
  }
}

const broken = (message) => new DbtlError(message);

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

function textOf(html) {
  return decodeEntities(html.replaceAll(/<[^>]*>/gu, ""))
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

function cellsOf(rowHtml) {
  return [...rowHtml.matchAll(/<t([hd])\b[^>]*>([\s\S]*?)<\/t\1>/giu)].map(
    (match) => match[2].trim()
  );
}

function rowsOf(tableHtml) {
  return [...tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/giu)].map(
    (match) => cellsOf(match[1])
  );
}

function isHeading(block) {
  return block.tag === "h1" || block.tag === "h2";
}

const CYCLE_HEADING = /^〔(基盤|設計)〕\s*([①②③④⑤⑥])\s*(.+?)\s*—\s*(.+)$/u;
const PART_HEADING = /^(第\s*[IVXⅠ-Ⅻ]+\s*部)[\s　]+(.+)$/u;

function parseCycleHeading(block) {
  const match = CYCLE_HEADING.exec(block.text);
  if (!match) {
    return null;
  }
  return {
    layer: LAYERS[match[1]],
    no: CIRCLED.indexOf(match[2]) + 1,
    title: match[3],
    tagline: match[4],
  };
}

function parsePartHeading(block) {
  const match = PART_HEADING.exec(block.text);
  return match ? { label: match[1], title: match[2] } : null;
}

// 太字だけの段落。中身のHTMLを返す。
function strongParagraph(block) {
  if (block.tag !== "p") {
    return null;
  }
  const match =
    /^<p\b[^>]*>\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)<\/p>$/u.exec(
      block.html
    );
  return match ? { label: textOf(match[1]), rest: match[2].trim() } : null;
}

const ITERATION_LABEL = /^反復\s*(\d+)\s*—\s*(.+)$/u;
const OUTCOMES_LABEL = /^このサイクル(?:で確立したこと|の現状)/u;
const HANDOFF_LABEL = /^↳\s*次のサイクル/u;

function parseHypothesisTable(block) {
  if (block.tag !== "table") {
    return null;
  }
  const rows = rowsOf(block.html);
  const byLabel = new Map(
    rows.map(([label, body]) => [textOf(label ?? ""), body])
  );
  if (!byLabel.has("仮説")) {
    return null;
  }
  return { hypothesis: byLabel.get("仮説"), criteria: byLabel.get("成功基準") };
}

// ヘッダが DESIGN/BUILD/TEST/LEARN の4列の表か。
function isIterationTable(block) {
  if (block.tag !== "table") {
    return false;
  }
  const [header = []] = rowsOf(block.html);
  return (
    header.map((cell) => textOf(cell).toUpperCase()).join(",") ===
    DBTL_HEADERS.join(",")
  );
}

function parseIterationTable(block, fail) {
  if (!isIterationTable(block)) {
    return null;
  }
  const rows = rowsOf(block.html);
  const [, body = []] = rows;
  if (rows.length !== 2 || body.length !== 4) {
    fail("反復の表が見出しの1行と本文の1行になっていません");
  }
  const [design, build, test, learn] = body;
  return { design, build, test, learn };
}

// なぜこの仮説に至ったかの本文と、仮説・成功基準の表を読む。後ろに続くブロックの開始位置も返す。
function parseOpening(blocks, fail) {
  const whyAt = blocks.findIndex((block) => block.tag === "h3");
  if (whyAt === -1) {
    fail("なぜこの仮説に至ったか(h3)の見出しがありません");
  }
  const hypothesisAt = blocks.findIndex(
    (block, index) => index > whyAt && parseHypothesisTable(block)
  );
  if (hypothesisAt === -1) {
    fail("仮説と成功基準の表がありません");
  }
  const { hypothesis, criteria } = parseHypothesisTable(blocks[hypothesisAt]);
  if (!hypothesis || !criteria) {
    fail("仮説または成功基準のセルが空です");
  }
  const whyHtml = joinHtml(blocks.slice(whyAt + 1, hypothesisAt));
  if (whyHtml === "") {
    fail("なぜこの仮説に至ったかの本文がありません");
  }
  return {
    leadHtml: joinHtml(blocks.slice(0, whyAt)),
    whyHtml,
    hypothesis,
    criteria,
    next: hypothesisAt + 1,
  };
}

function assertComplete(
  { iterations, hasOutcomes, outcomes, handoffHtml },
  fail
) {
  if (handoffHtml === "") {
    fail("次のサイクルへの受け渡し(↳ 次のサイクルへ)が読み取れません");
  }
  if (iterations.length === 0) {
    fail("反復がありません");
  }
  if (!hasOutcomes || outcomes.length === 0) {
    fail("このサイクルで確立したこと(または現状)の見出しか本文がありません");
  }
}

// 反復の表から、確立したことと次のサイクルへの受け渡しまでを読む。
function parseIterations(blocks, fail) {
  const iterations = [];
  const outcomes = [];
  const notes = [];
  let handoffHtml = "";
  let section = "iterations";
  let hasOutcomes = false;

  const flushNotes = () => {
    if (iterations.length > 0) {
      iterations.at(-1).notesHtml = joinHtml(notes);
    }
    notes.length = 0;
  };

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const strong = strongParagraph(block);
    const iteration =
      section === "iterations" && strong
        ? ITERATION_LABEL.exec(strong.label)
        : null;

    if (iteration) {
      flushNotes();
      const cells = parseIterationTable(blocks[i + 1] ?? { tag: "" }, fail);
      if (!cells) {
        fail(
          `反復${iteration[1]}の直後に DESIGN/BUILD/TEST/LEARN の表がありません`
        );
      }
      const no = Number(iteration[1]);
      if (no !== iterations.length + 1) {
        fail(
          `反復の番号が ${iterations.length + 1} から連番になっていません(${no})`
        );
      }
      iterations.push({ no, title: iteration[2], ...cells, notesHtml: "" });
      i += 1;
    } else if (
      section === "iterations" &&
      strong &&
      OUTCOMES_LABEL.test(strong.label)
    ) {
      flushNotes();
      hasOutcomes = true;
      section = "outcomes";
    } else if (
      section === "outcomes" &&
      strong &&
      HANDOFF_LABEL.test(strong.label)
    ) {
      handoffHtml = strong.rest;
      section = "handoff";
    } else if (section === "iterations" && iterations.length > 0) {
      if (isIterationTable(block)) {
        fail(
          "DESIGN/BUILD/TEST/LEARN の表の直前に、反復の見出し(太字の「反復N — 題」)がありません"
        );
      }
      notes.push(block);
    } else if (section === "outcomes") {
      outcomes.push(block);
    } else {
      fail(
        "反復の前、または次のサイクルへの受け渡しの後に、読み取れないブロックがあります"
      );
    }
  }
  flushNotes();

  assertComplete({ iterations, hasOutcomes, outcomes, handoffHtml }, fail);
  return { iterations, outcomesHtml: joinHtml(outcomes), handoffHtml };
}

// サイクル1つぶんのブロック(見出しを除く)を読む。
function parseCycleBody(blocks, where) {
  const fail = (reason) => {
    throw broken(`${where}: ${reason}`);
  };
  const { leadHtml, whyHtml, hypothesis, criteria, next } = parseOpening(
    blocks,
    fail
  );
  const { iterations, outcomesHtml, handoffHtml } = parseIterations(
    blocks.slice(next),
    fail
  );
  const body = {
    whyHtml,
    hypothesis,
    criteria,
    iterations,
    outcomesHtml,
    handoffHtml,
  };
  return leadHtml === "" ? body : { leadHtml, ...body };
}

function findMarks(blocks) {
  const marks = [];
  for (const [index, block] of blocks.entries()) {
    if (!isHeading(block)) {
      continue;
    }
    const cycle = parseCycleHeading(block);
    const part = cycle ? null : parsePartHeading(block);
    if (cycle) {
      marks.push({ index, kind: "cycle", ...cycle });
    } else if (part) {
      marks.push({ index, kind: "part", ...part });
    }
  }
  if (marks.length === 0) {
    throw new DbtlError("構造が見つかりません", { silent: true });
  }
  if (!marks.some((mark) => mark.kind === "cycle")) {
    throw broken("層の見出しはありますが、サイクルの見出しがありません");
  }
  if (marks[0].kind !== "part") {
    throw broken("最初のサイクルより前に層(第 ... 部)の見出しがありません");
  }
  return marks;
}

function parseBlocks(blocks) {
  const marks = findMarks(blocks);

  // 見出しの本文は次の層・サイクルの見出しまで。最後のサイクルは次の見出し(展望など)までで、そこから先が outro。
  const stopOf = (mark, i) => {
    if (marks[i + 1]) {
      return marks[i + 1].index;
    }
    const after = blocks.findIndex(
      (block, index) => index > mark.index && isHeading(block)
    );
    return after === -1 ? blocks.length : after;
  };

  const parts = [];
  let expectedNo = 1;
  for (const [i, mark] of marks.entries()) {
    const body = blocks.slice(mark.index + 1, stopOf(mark, i));
    if (mark.kind === "part") {
      parts.push({
        label: mark.label,
        title: mark.title,
        introHtml: joinHtml(body),
        cycles: [],
      });
      continue;
    }
    const where = `サイクル${mark.no}`;
    if (mark.no !== expectedNo) {
      throw broken(`${where}: 番号が ${expectedNo} から連番になっていません`);
    }
    expectedNo += 1;
    parts.at(-1).cycles.push({
      no: mark.no,
      layer: mark.layer,
      title: mark.title,
      tagline: mark.tagline,
      ...parseCycleBody(body, where),
    });
  }

  const emptyPart = parts.find((part) => part.cycles.length === 0);
  if (emptyPart) {
    throw broken(`${emptyPart.label}: サイクルがありません`);
  }

  const lastAt = marks.length - 1;
  const outroBlocks = blocks.slice(stopOf(marks[lastAt], lastAt));
  const stray = outroBlocks.find(
    (block) =>
      (isHeading(block) && /^〔(?:基盤|設計)〕/u.test(block.text)) ||
      isIterationTable(block)
  );
  if (stray) {
    throw broken(
      `最後のサイクルより後に、サイクルの見出しか反復の表が残っています(最後のサイクルの見出しが読めない可能性があります): ${stray.text.slice(0, 40)}`
    );
  }
  return {
    intro: joinHtml(blocks.slice(0, marks[0].index)),
    parts,
    outro: joinHtml(outroBlocks),
  };
}

// 読み取れたときは { dbtl }、構造が無いときは { dbtl: null }、崩れているときは { dbtl: null, warning } を返す。
export function readDbtl(html) {
  try {
    return { dbtl: parseBlocks(splitBlocks(html)) };
  } catch (error) {
    if (!(error instanceof DbtlError)) {
      throw error;
    }
    return error.silent
      ? { dbtl: null }
      : { dbtl: null, warning: error.message };
  }
}
