import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminApplications, approveApplication, rejectApplication } from "../../api";
import { formatDate, statusBadgeColor } from "../../lib/utils";

export default function AdminApplicationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adminApps", page, status],
    queryFn: () => getAdminApplications({ page, page_size: 20, status: status || undefined }),
  });

  const approve = useMutation({
    mutationFn: approveApplication,
    onSuccess: () => {
      setActionError("");
      qc.invalidateQueries({ queryKey: ["adminApps"] });
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || "Failed to approve application.");
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, r }: { id: string; r: string }) => rejectApplication(id, r),
    onSuccess: () => {
      setActionError("");
      qc.invalidateQueries({ queryKey: ["adminApps"] });
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
      setRejectId(null);
      setReason("");
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error || "Failed to reject application.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Application Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">Review candidates with atomic quota validation</p>
        </div>
        <div>
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-red-50 text-red-700 text-sm border border-red-200 rounded-lg">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading applications...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Reg Number</th>
                <th className="px-4 py-3 text-left font-semibold">Candidate Name</th>
                <th className="px-4 py-3 text-left font-semibold">District & State</th>
                <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!data?.data?.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No applications found matching the selected filter.
                  </td>
                </tr>
              ) : (
                data.data.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-800">{app.registration_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{app.full_name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{app.district_state_pin}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(app.submitted_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {app.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => approve.mutate(app.id)}
                            disabled={approve.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectId(app.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Reject Application</h3>
            <p className="text-xs text-gray-500 mb-4">
              Mandatory rejection reason will be stored in audit logs and shown to the applicant.
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Incomplete ID document or mismatch in details"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-400 outline-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setRejectId(null); setReason(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => reason.trim() && reject.mutate({ id: rejectId, r: reason })}
                disabled={!reason.trim() || reject.isPending}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {reject.isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

