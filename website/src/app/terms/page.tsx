import Link from "next/link";

export default function Terms() {
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
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-[var(--text-sub)] mb-6">
              Welcome to Wanderly. These terms of service govern your use of our
              platform.
            </p>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              Acceptance of Terms
            </h2>
            <p className="text-[var(--text-sub)] mb-4">
              By using Wanderly, you agree to be bound by these terms of
              service.
            </p>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              Use of Service
            </h2>
            <p className="text-[var(--text-sub)] mb-4">
              You may use our service for lawful purposes only and in accordance
              with these terms.
            </p>

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-4">
              Contact Us
            </h2>
            <p className="text-[var(--text-sub)]">
              If you have any questions about these Terms of Service, please
              contact us.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
