import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategoryQuota } from "../../api";
import { CategoryMetric } from "../../types";
import {
  X,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  Save,
  Sliders,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

interface CategoryQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryMetric[];
}

export default function CategoryQuotaModal({
  isOpen,
  onClose,
  categories,
}: CategoryQuotaModalProps) {
  const qc = useQueryClient();

  // Local state for quota limits mapping category_id -> limit
  const [quotas, setQuotas] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    categories.forEach(c => {
      initial[c.category_id] = c.approval_limit;
    });
    return initial;
  });

  const [savingId, setSavingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if categories change
  React.useEffect(() => {
    const updated: Record<number, number> = {};
    categories.forEach(c => {
      updated[c.category_id] = c.approval_limit;
    });
    setQuotas(updated);
  }, [categories]);

  const quotaMutation = useMutation({
    mutationFn: ({ catId, limit }: { catId: number; limit: number }) =>
      updateCategoryQuota(catId, limit),
    onSuccess: (data) => {
      setSuccessMessage(`Updated quota for ${data.code} to ${data.approval_limit} seats.`);
      setErrorMessage(null);
      setSavingId(null);
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setTimeout(() => setSuccessMessage(null), 3500);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.error || "Failed to update category quota. Please check constraints."
      );
      setSavingId(null);
    },
  });

  if (!isOpen) return null;

  const handleLimitChange = (catId: number, val: string) => {
    const num = parseInt(val, 10);
    setQuotas(prev => ({
      ...prev,
      [catId]: isNaN(num) ? 0 : Math.max(0, num),
    }));
  };

  const handleSaveSingle = (cat: CategoryMetric) => {
    const targetLimit = quotas[cat.category_id] ?? cat.approval_limit;
    if (targetLimit <= 0) {
      setErrorMessage("Quota limit must be greater than zero.");
      return;
    }
    if (targetLimit < cat.approved_count) {
      setErrorMessage(
        `Cannot reduce quota to ${targetLimit}. Already approved: ${cat.approved_count} candidates.`
      );
      return;
    }
    setSavingId(cat.category_id);
    setErrorMessage(null);
    quotaMutation.mutate({ catId: cat.category_id, limit: targetLimit });
  };

  const totalSanctioned = Object.values(quotas).reduce((sum, n) => sum + (n || 0), 0);
  const totalApproved = categories.reduce((sum, c) => sum + c.approved_count, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/30 text-primary-300 border border-primary-500/40 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Category Quota Management</h3>
                <span className="text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Super Admin Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Set and enforce sanctioned candidate capacity per trade. Atomic ACID row locks prevent race conditions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="p-3.5 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body: Table matching image */}
        <div className="overflow-y-auto p-6 space-y-4">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Job Role</th>
                  <th className="px-4 py-3.5 text-center">Approved</th>
                  <th className="px-4 py-3.5 text-center">Sanctioned Quota (Candidates)</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map(cat => {
                  const currentVal = quotas[cat.category_id] ?? cat.approval_limit;
                  const isDirty = currentVal !== cat.approval_limit;
                  const isSaving = savingId === cat.category_id;
                  const isFull = cat.approved_count >= currentVal;

                  return (
                    <tr
                      key={cat.category_id}
                      className="hover:bg-slate-50/60 transition group"
                    >
                      {/* Job Role Title + Code */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                            {cat.code}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block leading-tight">
                              {cat.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Remaining Quota: {Math.max(0, currentVal - cat.approved_count)} seats
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Approved Headcount */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                        {cat.approved_count}
                      </td>

                      {/* Editable Candidates Quota Limit Input */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="number"
                          min={cat.approved_count}
                          value={currentVal}
                          onChange={e => handleLimitChange(cat.category_id, e.target.value)}
                          className={`w-28 text-center font-mono font-black text-xs py-1.5 px-2 border rounded-xl transition ${
                            isDirty
                              ? "border-primary-500 bg-primary-50/30 text-primary-950 ring-2 ring-primary-500/20"
                              : "border-slate-300 bg-white text-slate-900 focus:border-primary-500 focus:outline-none"
                          }`}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isFull ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 text-rose-600" /> Quota Full
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Unlock className="w-3 h-3 text-blue-600" /> Open
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSaveSingle(cat)}
                          disabled={!isDirty || isSaving}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer shadow-2xs ${
                            isDirty
                              ? "bg-primary-700 hover:bg-primary-800 text-white"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100/90 font-black text-slate-900 border-t border-slate-200 text-xs">
                <tr>
                  <td className="px-5 py-3.5 uppercase tracking-wider">TOTAL SANCTIONED SEATS</td>
                  <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-800">
                    {totalApproved}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-black text-sm text-primary-900">
                    {totalSanctioned.toLocaleString()}
                  </td>
                  <td colSpan={2} className="px-5 py-3.5 text-right text-slate-500 font-semibold text-[11px]">
                    Available Capacity: {(totalSanctioned - totalApproved).toLocaleString()} seats
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Super Administrator Quota Modification: Changes apply globally in real-time.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Done Managing Quotas
          </button>
        </div>
      </div>
    </div>
  );
}

