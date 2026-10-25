import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Delete your account | Keefie",
  description: "How to delete your Keefie account and data.",
};

// Play's account deletion requirement: a web link that names the app and explains
// how to delete the account and its data without reinstalling the app. Keep in
// line with section 20 of src/content/privacyPolicy.ts.
export default function DeleteAccount() {
  return (
    <LegalPage title="Delete your Keefie account" updated="24 October 2026">
      <p>
        This page is for the <strong>Keefie</strong> app, operated by Withera Labs Private Limited.
      </p>

      <h2>In the app</h2>
      <p>
        Open Keefie, go to <strong>Settings</strong>, tap <strong>Delete Account</strong>, and confirm. Uninstalling
        the app does not delete your account.
      </p>

      <h2>Without the app</h2>
      <p>
        Email{" "}
        <a href="mailto:support@sparkeefy.com?subject=Account%20Deletion%20Request">support@sparkeefy.com</a> with the
        subject <strong>Account Deletion Request</strong> and the phone number or Google account email linked to your
        Keefie account. We may need to verify that the account is yours before deleting it. Never send passwords or
        OTPs by email.
      </p>

      <h2>What gets deleted</h2>
      <p>
        We delete or de-identify the personal information tied to your account: your profile, the people you added,
        memories, notes, events, Wingman conversations and uploaded photos. This cannot be undone.
      </p>
      <p>
        Limited records may stay for a short time in encrypted backups and security logs until they expire, or where
        the law requires us to keep them. See section 20 of our <a href="/privacy-policy">Privacy Policy</a>. To stop
        the Wingman bubble right away, turn it off in Settings → Accessibility → Keefie.
      </p>
    </LegalPage>
  );
}
