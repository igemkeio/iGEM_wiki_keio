import PageShell from "@/components/PageShell";
import { listSlugs, readPage } from "@/lib/wiki";

export function generateStaticParams() {
  return listSlugs("en")
    .filter((slug) => slug !== "home")
    .map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default function Page({ params }: { params: { slug: string } }) {
  const page = readPage("en", params.slug);
  return (
    <PageShell
      locale="en"
      slug={params.slug}
      title={page.title}
      lead={page.lead}
      contentHtml={page.content}
    />
  );
}
