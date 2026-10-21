import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Delete your account | Sparkeefy",
  description: "How to delete your Sparkeefy account and data.",
};

// Play's account deletion requirement: a web link that names the app and explains
// how to delete the account and its data without reinstalling the app.
export default function DeleteAccount() {
  return (
    <LegalPage title="Delete your Sparkeefy account" updated="21 October 2026">
      <p>This page is for the <strong>Sparkeefy</strong> app (Android package com.sparkeefy.app).</p>

      <h2>In the app</h2>
      <p>Open Sparkeefy, go to <strong>Profile &gt; Settings</strong>, tap <strong>Delete Account</strong>, and confirm.</p>

      <h2>Without the app</h2>
      <p>
        Email <a href="mailto:founder@sparkeefy.com?subject=Delete%20my%20Sparkeefy%20account">founder@sparkeefy.com</a>{" "}
        from any address with the subject &quot;Delete my Sparkeefy account&quot; and the phone number or Google email you
        signed in with. We will confirm it is your account and delete it within 30 days.
      </p>

      <h2>What gets deleted</h2>
      <p>
        Everything tied to your account: your profile and photo, the people you added, memories, events, Wingman chats,
        facts Wingman remembered, uploaded photos and notification settings. This cannot be undone.
      </p>
      <p>
        Security logs and backups that include your data are kept only as long as needed and are then deleted
        automatically. To stop the Wingman bubble right away, turn it off in Settings &gt; Accessibility &gt; Sparkeefy.
      </p>
    </LegalPage>
  );
}
