import { useQuery } from "@tanstack/react-query";
import { getAdminMetrics } from "../../api";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: getAdminMetrics,
    refetchInterval: 15000,
  });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Loading admin metrics...</div>;
  if (!data) return null;

  const cards = [
    { label: "Total Applications", value: data.total_applied, bg: "bg-blue-50 border-blue-200 text-blue-800" },
    { label: "Pending Review", value: data.pending, bg: "bg-amber-50 border-amber-200 text-amber-800" },
    { label: "Approved Candidates", value: data.approved, bg: "bg-emerald-50 border-emerald-200 text-emerald-800" },
    { label: "Rejected Candidates", value: data.rejected, bg: "bg-rose-50 border-rose-200 text-rose-800" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Operational Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time quota monitoring and applicant funnel</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.bg}`}>
            <div className="text-3xl font-extrabold">{c.value.toLocaleString()}</div>
            <div className="text-xs font-semibold mt-1 opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800">Category Quota Allocations</h2>
          <span className="text-xs text-gray-500 font-mono">Total Target: 3,020 Candidates</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Code</th>
              <th className="px-6 py-3 text-left font-semibold">Job Role</th>
              <th className="px-6 py-3 text-center font-semibold">Quota Target</th>
              <th className="px-6 py-3 text-center font-semibold">Approved</th>
              <th className="px-6 py-3 text-center font-semibold">Pending</th>
              <th className="px-6 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.categories.map(cat => (
              <tr key={cat.category_id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3 font-mono text-xs font-bold text-primary-800">{cat.code}</td>
                <td className="px-6 py-3 font-medium text-gray-900">{cat.title}</td>
                <td className="px-6 py-3 text-center text-gray-600">{cat.approval_limit}</td>
                <td className="px-6 py-3 text-center font-bold text-emerald-700">{cat.approved_count}</td>
                <td className="px-6 py-3 text-center font-medium text-amber-700">{cat.pending_count}</td>
                <td className="px-6 py-3 text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cat.is_approval_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {cat.is_approval_open ? "OPEN" : "LOCKED"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
