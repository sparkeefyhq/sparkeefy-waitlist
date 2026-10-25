import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { PRIVACY_POLICY_MD } from "@/content/privacyPolicy";
import { parsePolicy, PolicyBlocks } from "@/lib/legal/policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Keefie",
  description: "What the Keefie app collects, why, who processes it, and how to delete it.",
};

const policy = parsePolicy(PRIVACY_POLICY_MD);

// Plain copy of the policy for the Play Console privacy policy URL. Same source
// as the section on /privacy (src/content/privacyPolicy.ts).
export default function PrivacyPolicy() {
  return (
    <LegalPage title={`Keefie ${policy.title}`} effective={policy.effective} updated={policy.updated ?? ""}>
      <PolicyBlocks blocks={policy.intro} />
      {policy.sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28">
          <h2>{s.title}</h2>
          <PolicyBlocks blocks={s.blocks} />
        </section>
      ))}
    </LegalPage>
  );
}
