import type { HealthReport } from "../types/health";

interface HealthReportProps {
  report: HealthReport;
}

export function HealthReport({ report }: HealthReportProps) {
  const formatValue = (value: string | number | null | string[]) => {
    if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-gray-400 italic">Not collected</span>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : <span className="text-gray-400 italic">None</span>;
    }
    return value;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="bg-health-600 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-xl font-semibold">Health Screening Report</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Name</h3>
            <p className="text-lg font-semibold text-gray-900">{formatValue(report.patientName)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Main Concern</h3>
            <p className="text-lg font-semibold text-gray-900">{formatValue(report.mainConcern)}</p>
          </div>
        </div>

        {/* Symptoms */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Symptoms</h3>
          <p className="text-gray-900">{formatValue(report.symptoms)}</p>
        </div>

        {/* Duration and Severity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
            <p className="text-gray-900">{formatValue(report.duration)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Severity (1-10)</h3>
            <p className="text-gray-900">{formatValue(report.severity)}</p>
          </div>
        </div>

        {/* Related Symptoms */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Related Symptoms</h3>
          <p className="text-gray-900">{formatValue(report.relatedSymptoms)}</p>
        </div>

        {/* Red Flags */}
        {report.redFlags && report.redFlags.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">⚠️ Flags Requiring Attention</h3>
            <ul className="list-disc list-inside text-red-900">
              {report.redFlags.map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Notes */}
        {report.followUpNotes && report.followUpNotes.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Follow-up Notes</h3>
            <ul className="list-disc list-inside text-blue-900">
              {report.followUpNotes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Information Missing */}
        {report.informationMissing && report.informationMissing.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">Information Not Collected</h3>
            <ul className="list-disc list-inside text-yellow-900">
              {report.informationMissing.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety Disclaimer */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs text-gray-500 text-center">
            This AI screening is for informational purposes only and is not a medical diagnosis or a substitute for professional medical care.
          </p>
        </div>
      </div>
    </div>
  );
}
