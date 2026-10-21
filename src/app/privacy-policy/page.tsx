import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Sparkeefy",
  description: "What the Sparkeefy app collects, why, who processes it, and how to delete it.",
};

// Keep in sync with the in-app Accessibility disclosure, the Play listing and the
// Play Data safety form (sparkeefy-mobile PermissionGuideExact.tsx).
export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="21 October 2026">
      <p>
        This policy explains what the Sparkeefy app (Android package <strong>com.sparkeefy.app</strong>) and
        sparkeefy.com collect, why we collect it, who processes it for us, and how you can delete it. Questions:{" "}
        <a href="mailto:founder@sparkeefy.com">founder@sparkeefy.com</a>.
      </p>

      <h2>1. The Wingman bubble (Android Accessibility Service)</h2>
      <p>
        Sparkeefy uses Android&apos;s AccessibilityService API to show the Wingman bubble in supported messaging and
        dating apps: WhatsApp, WhatsApp Business, Instagram, Snapchat, Discord, Tinder, Bumble, Hinge, Badoo,
        OkCupid, Grindr, Match and Coffee Meets Bagel. It is off until you read our in-app disclosure, tap Agree, and
        turn it on in Settings.
      </p>
      <ul>
        <li>
          <strong>What it reads:</strong> only when you tap the bubble, the messages visible on your screen in that
          chat, the name of the contact or group you are chatting with, and sender names in group chats.
        </li>
        <li>
          <strong>Why:</strong> we send this to our servers and our AI provider only to write reply suggestions and to
          remember context about that person in your People list.
        </li>
        <li>
          <strong>What it never does:</strong> it reads nothing until you tap, reads no other apps, never sends a
          message for you (a reply only goes into the message box when you tap it, and you press send), never changes
          your settings, and is never used for ads.
        </li>
        <li>
          <strong>What we keep:</strong> we do not keep a log of the chats you read with the bubble. We may save short
          facts about a person you have saved (for example, a note you typed) to your Sparkeefy memory, which you can
          delete. Internal team test accounts may keep samples to improve quality.
        </li>
        <li>
          <strong>Turning it off:</strong> anytime in Settings &gt; Accessibility &gt; Sparkeefy.
        </li>
      </ul>

      <h2>2. What else we collect</h2>
      <ul>
        <li><strong>Account:</strong> your phone number (for the sign-in code), or your Google account name and email if you sign in with Google.</li>
        <li><strong>Profile:</strong> what you enter during onboarding, such as your name, photo, gender and preferences.</li>
        <li><strong>People and memories:</strong> the people you add (names, relationship, notes, dates, photos), memories, events and reminders.</li>
        <li><strong>Wingman chats:</strong> messages you send to Wingman in the app and its replies, plus facts Wingman remembers about the people you talk about.</li>
        <li><strong>Location:</strong> only if you allow it, your device location when you capture a moment or ask for place ideas.</li>
        <li><strong>Photos and camera:</strong> only the photos you choose or take inside the app.</li>
        <li><strong>Notifications:</strong> a push token so we can send reminders you can turn off.</li>
        <li><strong>Usage and diagnostics:</strong> which features you use, app errors and performance, to fix and improve the app.</li>
      </ul>

      <h2>3. How we use it</h2>
      <p>
        To run the app (sign-in, your people, Wingman replies, reminders, gift, place and movie ideas), to keep it
        secure, and to fix and improve it. We do not sell your data, and we do not use it for advertising.
      </p>

      <h2>4. Who processes it for us</h2>
      <ul>
        <li>Google Cloud (India): our servers.</li>
        <li>Supabase (India): our database and sign-in.</li>
        <li>OpenRouter and the AI model providers it routes to: writing Wingman replies.</li>
        <li>Message Central: sending sign-in codes by SMS.</li>
        <li>Google Places, TMDB and shopping sources: place, movie and gift ideas (we send your search, not your chats).</li>
        <li>PostHog: product analytics.</li>
        <li>Expo and Firebase Cloud Messaging: push notifications.</li>
        <li>Resend: account emails.</li>
      </ul>
      <p>They process data only to provide their service to us. Data is encrypted in transit.</p>

      <h2>5. How long we keep it, and deleting it</h2>
      <p>
        We keep your data while your account is active. You can delete your account in the app (Profile &gt; Settings &gt;
        Delete Account) or ask us at <a href="/delete-account">sparkeefy.com/delete-account</a>. Deleting your account
        permanently removes your profile, people, memories, chats and uploaded photos. You can also edit or delete
        individual people and memories in the app at any time.
      </p>

      <h2>6. Changes</h2>
      <p>If we change how we handle your data, we will update this page and tell you in the app before it applies.</p>
    </LegalPage>
  );
}
