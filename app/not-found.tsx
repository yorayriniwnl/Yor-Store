import Link from "next/link";

export default function NotFound() {
  return (
    <div className="yor-store-shell flex min-h-screen items-center justify-center font-sans">
      <div className="text-center">
        <div className="yor-kicker mb-4">YOR STORE / 404</div>
        <h1 className="mb-2 text-3xl font-medium text-[#f5eaea]">Signal not found</h1>
        <p className="mb-6 text-[#c4c4c4]">The product or page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="yor-buy-button inline-flex px-6 py-3 font-semibold transition-colors">
          Return to index
        </Link>
      </div>
    </div>
  );
}
