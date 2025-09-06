import Link from 'next/link';
import ComparisonForm from '@/components/ComparisonForm';

export default function NewComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mb-6 px-4 pt-8">
        <Link href="/comparisons" className="text-blue-400 hover:text-blue-300 inline-block">
          ← Back to Comparisons
        </Link>
      </div>
      <ComparisonForm mode="add" />
    </div>
  );
}
