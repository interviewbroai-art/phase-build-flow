import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — InterviewBro AI" },
      { name: "description", content: "How InterviewBro AI collects, uses, and protects your personal information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="01 June 2026">
      <p>InterviewBro AI respects your privacy and is committed to protecting your personal information.</p>

      <h2>Information We Collect</h2>
      <p>We may collect:</p>
      <ul>
        <li>Name</li>
        <li>Email address</li>
        <li>Account information</li>
        <li>Interview responses and recordings</li>
        <li>Device and usage information</li>
        <li>Payment information (through third-party payment providers)</li>
      </ul>

      <h2>How We Use Information</h2>
      <p>We use collected information to:</p>
      <ul>
        <li>Provide interview practice services</li>
        <li>Improve AI performance</li>
        <li>Personalize user experiences</li>
        <li>Communicate service updates</li>
        <li>Maintain platform security</li>
      </ul>

      <h2>AI Processing</h2>
      <p>Interview responses may be processed by third-party AI providers to generate feedback and insights.</p>

      <h2>Data Sharing</h2>
      <p>We do not sell personal information. We may share information with:</p>
      <ul>
        <li>Service providers</li>
        <li>Payment processors</li>
        <li>Analytics providers</li>
        <li>Legal authorities when required by law</li>
      </ul>

      <h2>Data Security</h2>
      <p>We implement reasonable security measures to protect user information.</p>

      <h2>Data Retention</h2>
      <p>We retain information only as long as necessary to provide services and comply with legal obligations.</p>

      <h2>Your Rights</h2>
      <p>Depending on your location, you may have rights to:</p>
      <ul>
        <li>Access your data</li>
        <li>Correct inaccurate information</li>
        <li>Delete your account</li>
        <li>Request data export</li>
      </ul>

      <h2>Contact</h2>
      <p>For privacy-related requests, contact: <a href="mailto:privacy@email.com">privacy@email.com</a></p>
    </LegalShell>
  );
}
