import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — InterviewBro AI" },
      { name: "description", content: "Terms of use for InterviewBro AI — AI-powered interview preparation platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" updated="01 June 2026">
      <p>Welcome to InterviewBro AI. By accessing or using our platform, you agree to these Terms & Conditions.</p>

      <h2>1. Use of the Service</h2>
      <p>InterviewBro AI provides AI-powered interview preparation, practice sessions, feedback, and related educational tools.</p>
      <p>You agree to:</p>
      <ul>
        <li>Use the platform lawfully.</li>
        <li>Provide accurate information.</li>
        <li>Not misuse, copy, or reverse engineer the service.</li>
      </ul>

      <h2>2. User Accounts</h2>
      <p>You are responsible for maintaining the security of your account and password.</p>

      <h2>3. AI-Generated Content</h2>
      <p>InterviewBro AI uses artificial intelligence to generate responses and feedback. AI-generated content may contain inaccuracies and should not be considered professional employment, legal, or career advice.</p>

      <h2>4. Intellectual Property</h2>
      <p>All platform content, branding, software, designs, and features belong to InterviewBro AI unless otherwise stated.</p>

      <h2>5. Prohibited Activities</h2>
      <p>Users may not:</p>
      <ul>
        <li>Upload malicious code.</li>
        <li>Attempt unauthorized access.</li>
        <li>Use the service for illegal purposes.</li>
        <li>Share harmful or abusive content.</li>
      </ul>

      <h2>6. Limitation of Liability</h2>
      <p>InterviewBro AI is provided "as is" without warranties. We are not responsible for hiring outcomes, job offers, or decisions made based on AI-generated feedback.</p>

      <h2>7. Termination</h2>
      <p>We may suspend or terminate accounts that violate these Terms.</p>

      <h2>8. Changes</h2>
      <p>We may update these Terms at any time. Continued use of the platform constitutes acceptance of updated Terms.</p>

      <h2>9. Contact</h2>
      <p>For questions regarding these Terms, contact: <a href="mailto:josephsandhya25@email.com">josephsandhya25@email.com</a></p>
    </LegalShell>
  );
}
