import Link from "next/link";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-top)] to-[var(--bg-bottom)]">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link
            href="/"
            className="text-[var(--primary-orange)] hover:underline mb-8 inline-block"
          >
            ← Back to Wanderly
          </Link>

          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-[var(--text-sub)] mb-6">
              At Wanderly, we respect your privacy and are committed to
              protecting your personal information.
            </p>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              Information We Collect
            </h2>
            <p className="text-[var(--text-sub)] mb-4">
              We collect information you provide directly to us, such as when
              you join our waitlist, including your email address.
            </p>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              How We Use Your Information
            </h2>
            <p className="text-[var(--text-sub)] mb-4">
              We use the information we collect to send you product updates and
              notify you when Wanderly launches.
            </p>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              Contact Us
            </h2>
            <p className="text-[var(--text-sub)]">
              If you have any questions about this Privacy Policy, please
              contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
