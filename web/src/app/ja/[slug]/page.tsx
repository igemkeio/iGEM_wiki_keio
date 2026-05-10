import PageShell from "@/components/PageShell";
import { listSlugs, readPage } from "@/lib/wiki";

export function generateStaticParams() {
  return listSlugs("ja")
    .filter((slug) => slug !== "home")
    .map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default function JaPage({ params }: { params: { slug: string } }) {
  const page = readPage("ja", params.slug);
  return (
    <PageShell
      locale="ja"
      slug={params.slug}
      title={page.title}
      lead={page.lead}
      contentHtml={page.content}
    />
  );
}
