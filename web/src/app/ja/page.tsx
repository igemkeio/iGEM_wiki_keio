import PageShell from "@/components/PageShell";
import { readPage } from "@/lib/wiki";

export default function JaHome() {
  const page = readPage("ja", "home");
  return (
    <PageShell
      locale="ja"
      slug="home"
      title={page.title}
      lead={page.lead}
      contentHtml={page.content}
    />
  );
}
