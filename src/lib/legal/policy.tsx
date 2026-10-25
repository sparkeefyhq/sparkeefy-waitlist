import React from "react";

// Small reader for the policy text in src/content: "# " title, "## " sections,
// "### " sub-headings, "- " bullets, **bold**, [links](url) and lines ending in
// two spaces as line breaks. Enough for legal copy without a markdown dependency.

export type PolicyBlock =
  | { kind: "h3"; text: string }
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] };

export type PolicySection = { id: string; title: string; blocks: PolicyBlock[] };

export type Policy = {
  title: string;
  effective?: string;
  updated?: string;
  intro: PolicyBlock[];
  sections: PolicySection[];
};

const sectionId = (title: string) => {
  const number = title.match(/^(\d+)\./)?.[1];
  return number ? `policy-${number}` : `policy-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
};

export function parsePolicy(markdown: string): Policy {
  const policy: Policy = { title: "", intro: [], sections: [] };
  let blocks = policy.intro;
  let paragraph: string[] | null = null;

  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    if (!line) {
      paragraph = null;
      continue;
    }
    if (line.startsWith("# ")) {
      policy.title = line.slice(2);
    } else if (line.startsWith("## ")) {
      const title = line.slice(3);
      const section = { id: sectionId(title), title, blocks: [] };
      policy.sections.push(section);
      blocks = section.blocks;
      paragraph = null;
    } else if (line.startsWith("### ")) {
      blocks.push({ kind: "h3", text: line.slice(4) });
      paragraph = null;
    } else if (line.startsWith("- ")) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(line.slice(2));
      else blocks.push({ kind: "ul", items: [line.slice(2)] });
      paragraph = null;
    } else if (paragraph) {
      paragraph.push(line);
    } else {
      paragraph = [line];
      blocks.push({ kind: "p", lines: paragraph });
    }
  }

  // The dates sit in the first intro paragraph; show them as metadata instead.
  const first = policy.intro[0];
  if (first?.kind === "p") {
    const rest = first.lines.filter((line) => {
      const effective = line.match(/^\*\*Effective Date:\*\*\s*(.+)$/);
      const updated = line.match(/^\*\*Last Updated:\*\*\s*(.+)$/);
      if (effective) policy.effective = effective[1];
      if (updated) policy.updated = updated[1];
      return !effective && !updated;
    });
    if (rest.length) first.lines = rest;
    else policy.intro.shift();
  }

  return policy;
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const external = link[2].startsWith("http");
      return (
        <a key={i} href={link[2]} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

export function PolicyBlocks({ blocks }: { blocks: PolicyBlock[] }) {
  return blocks.map((block, i) => {
    if (block.kind === "h3") return <h3 key={i}>{renderInline(block.text)}</h3>;
    if (block.kind === "ul")
      return (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    return (
      <p key={i}>
        {block.lines.map((line, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {renderInline(line)}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

// Shared typography for policy text on the dark site.
export const policyProse =
  "text-[15px] leading-7 text-white/75 [&_a]:text-pink-300 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-pink-200 [&_h3]:mb-1 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_li]:mt-1.5 [&_li]:marker:text-pink-300/70 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-white [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5";
