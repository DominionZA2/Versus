import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-100 mb-6">
          Versus
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Create comparisons to help you make better decisions
        </p>
        <Link 
          href="/comparisons" 
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          View Comparisons
        </Link>
      </div>
    </div>
  );
}