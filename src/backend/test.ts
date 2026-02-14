// test-email.ts
import { config as loadDotenv } from "dotenv";
loadDotenv({ path: ".env" });

import { emailService } from "./services/EmailService";

async function testEmail() {
  console.log("🧪 Testing Email Service...\n");

  try {
    await emailService.sendMagicLinkEmail({
      email: "sparkeefy@gmail.com", // !! CHANGE THIS TO YOUR EMAIL
      magicLinkUrl: "https://sparkeefy.com/auth/magic?token=abc123def456",
      referralCode: "TEST1234",
      referralLink: "https://sparkeefy.com?ref=TEST1234",
    });

    console.log("✅ Email sent successfully! Check your inbox.");
  } catch (error) {
    console.error("❌ Email failed:", error);
  }
}

testEmail();
