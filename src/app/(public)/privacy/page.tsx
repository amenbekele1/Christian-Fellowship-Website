import { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const updated = "21 September 2026";

  return (
    <>
      <section className="hero-gradient py-16 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">Legal</p>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-brown-200 text-sm">Last updated: {updated}</p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-6 prose prose-sm prose-gray max-w-none">

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 text-sm text-amber-900">
            <strong>Summary:</strong> We collect your name, email address, and optional phone number
            to manage your fellowship membership. We do not sell your data to anyone. You can ask us
            to delete your account at any time.
          </div>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">1. Who We Are</h2>
          <p className="text-gray-600 leading-relaxed">
            Warsaw Ethiopian Christian Fellowship ("we", "us", "our") is a Christian community based at
            Naddnieprzańska 7, 04-205 Warszawa, Poland. We operate the member portal at wetcf.com. As a
            data controller under the General Data Protection Regulation (GDPR), we are responsible for
            the personal data you provide to us.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            Contact us about data matters: <a href="mailto:info@wetcf.com" className="text-gold-600 hover:underline">info@wetcf.com</a>
          </p>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">2. What Data We Collect</h2>
          <p className="text-gray-600 leading-relaxed">When you register as a member, we collect:</p>
          <ul className="text-gray-600 space-y-1 mt-2 ml-4 list-disc">
            <li><strong>Full name</strong> — to identify you within the fellowship community</li>
            <li><strong>Email address</strong> — to send you fellowship announcements, book reminders, and account notifications</li>
            <li><strong>Phone number</strong> (optional) — so your BUS group leader can contact you</li>
            <li><strong>Password</strong> — stored as a secure cryptographic hash; we never see your actual password</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            We also automatically collect session cookies (small text files) when you log in. These are
            strictly necessary for the member portal to function and do not require separate consent
            under GDPR.
          </p>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">3. Why We Process Your Data</h2>
          <p className="text-gray-600 leading-relaxed">We use your data for the following purposes:</p>
          <ul className="text-gray-600 space-y-1 mt-2 ml-4 list-disc">
            <li>Managing your fellowship membership account (legal basis: your consent at registration)</li>
            <li>Sending fellowship announcements, event reminders, and pastoral care notifications (legal basis: legitimate interests of the fellowship community)</li>
            <li>Recording attendance to support pastoral follow-up for absent members (legal basis: legitimate interests)</li>
            <li>Managing library book loans and sending return reminders (legal basis: performance of a service you requested)</li>
            <li>Facilitating BUS group communication and pastoral care (legal basis: legitimate interests)</li>
          </ul>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">4. Who Has Access to Your Data</h2>
          <p className="text-gray-600 leading-relaxed">
            Within the fellowship, only <strong>Guardians</strong> (fellowship leaders) have access to
            all member data. <strong>BUS group leaders</strong> can see the names and contact details of
            members in their group. Regular members can see only their own data.
          </p>
          <p className="text-gray-600 leading-relaxed mt-2">
            We use the following third-party services to operate the portal. Each is bound by its own
            GDPR-compliant data processing agreements:
          </p>
          <ul className="text-gray-600 space-y-1 mt-2 ml-4 list-disc">
            <li><strong>Railway</strong> (railway.app) — database hosting in the EU</li>
            <li><strong>Vercel</strong> (vercel.com) — website hosting and serverless functions</li>
            <li><strong>Namecheap PrivateEmail</strong> — email delivery from info@wetcf.com</li>
            <li><strong>Vercel Blob</strong> — storage for uploaded images and documents</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-2">
            We do not sell, rent, or share your personal data with any other third parties.
          </p>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">5. How Long We Keep Your Data</h2>
          <p className="text-gray-600 leading-relaxed">
            We keep your personal data for as long as you are a member of the fellowship. If you request
            deletion of your account, we will delete your personal data within 30 days. Attendance
            records may be retained in anonymised form for statistical purposes.
          </p>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">6. Your Rights Under GDPR</h2>
          <p className="text-gray-600 leading-relaxed">As a resident of the EU/EEA, you have the right to:</p>
          <ul className="text-gray-600 space-y-1 mt-2 ml-4 list-disc">
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — update your name, email, or phone from your Profile page</li>
            <li><strong>Deletion</strong> — delete your account from your Profile page, or email us at info@wetcf.com</li>
            <li><strong>Objection</strong> — object to processing based on legitimate interests</li>
            <li><strong>Portability</strong> — request your data in a machine-readable format</li>
            <li><strong>Withdraw consent</strong> — at any time, without affecting lawfulness of prior processing</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            To exercise any of these rights, email <a href="mailto:info@wetcf.com" className="text-gold-600 hover:underline">info@wetcf.com</a>.
            We will respond within 30 days. You also have the right to lodge a complaint with the Polish
            data protection authority (UODO) at <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline">uodo.gov.pl</a>.
          </p>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">7. Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We take reasonable technical and organisational measures to protect your data. Passwords are
            stored using bcrypt hashing (never in plain text). All data is transmitted over HTTPS. Access
            to the database is restricted to authorised personnel only.
          </p>

          <h2 className="font-display text-xl font-bold text-gray-800 mt-8 mb-3">8. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this policy from time to time. The date at the top of this page will reflect
            any changes. Significant changes will be communicated via a fellowship announcement.
          </p>

          <div
            className="mt-12 p-6 rounded-2xl text-center"
            style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
          >
            <p className="text-sm text-gray-600">
              Questions about this policy? Email us at{" "}
              <a href="mailto:info@wetcf.com" className="text-gold-600 font-medium hover:underline">
                info@wetcf.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
