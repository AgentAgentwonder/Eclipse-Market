import { TaxCenter } from '../components/portfolio/TaxCenter';

export default function TaxCenterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Tax Center</h1>
          <p className="text-gray-400 text-sm">
            Manage tax projections, harvest opportunities, and compliance documentation.
          </p>
        </div>
      </div>
      <TaxCenter />
    </div>
  );
}
