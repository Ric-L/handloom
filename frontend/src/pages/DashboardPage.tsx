import { useQuery } from "@tanstack/react-query";
import { getMyApplications } from "../api";
import { formatDate, statusBadgeColor } from "../lib/utils";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["myApplications"], queryFn: getMyApplications });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Loading your applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Review your submitted registrations and tracking status</p>
        </div>
        <Link
          to="/categories"
          className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition"
        >
          + Apply for Another Role
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-5xl mb-4">📜</div>
          <h3 className="text-lg font-semibold text-gray-800">No Applications Submitted</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            You haven't submitted any training applications yet.
          </p>
          <Link
            to="/categories"
            className="inline-block bg-primary-700 hover:bg-primary-800 text-white px-5 py-2 rounded-lg text-sm font-medium"
          >
            Browse Available Categories
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-primary-800 bg-primary-50 px-2.5 py-1 rounded">
                    {app.registration_no}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-lg mt-2">{app.full_name}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    Submitted on {formatDate(app.submitted_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadgeColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              </div>

              {app.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <span className="font-bold">Admin Remarks / Reason:</span> {app.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
