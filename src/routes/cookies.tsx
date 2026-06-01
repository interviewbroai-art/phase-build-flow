import { createFileRoute } from "@tanstack/react-router";
import { LegalShell } from "@/components/legal/LegalShell";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — InterviewBro AI" },
      { name: "description", content: "How InterviewBro AI uses cookies and similar technologies." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalShell title="Cookie Policy" updated="01 June 2026">
      <p>InterviewBro AI uses cookies and similar technologies to improve user experience.</p>

      <h2>What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device that help websites function properly.</p>

      <h2>Types of Cookies We Use</h2>
      <h3>Essential Cookies</h3>
      <p>Required for login, authentication, and core platform functionality.</p>
      <h3>Analytics Cookies</h3>
      <p>Help us understand how users interact with the platform.</p>
      <h3>Performance Cookies</h3>
      <p>Improve website speed and reliability.</p>
      <h3>Preference Cookies</h3>
      <p>Remember user settings and preferences.</p>

      <h2>Managing Cookies</h2>
      <p>You can control or disable cookies through your browser settings. Some platform features may not work properly if cookies are disabled.</p>

      <h2>Third-Party Cookies</h2>
      <p>We may use third-party services such as analytics and payment providers that set their own cookies.</p>

      <h2>Updates</h2>
      <p>We may update this Cookie Policy from time to time.</p>

      <h2>Contact</h2>
      <p>For questions about cookies, contact: <a href="mailto:josephsandhya25@email.com">josephsandhya25@email.com</a></p>
    </LegalShell>
  );
}
