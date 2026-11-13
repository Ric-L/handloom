import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";
import {
  getCategories,
  createAdminCategory,
  updateAdminCategory,
  toggleAdminCategory,
  deleteAdminCategory,
} from "../../api";
import type { JobCategory } from "../../types";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  // Dialog State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formLimit, setFormLimit] = useState<number>(100);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Queries
  const { data: categories = [], isLoading, error } = useQuery<JobCategory[]>({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      setIsAddModalOpen(false);
      resetForm();
      setActionMsg({ type: "success", text: "New trade category registered successfully." });
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error || "Failed to create category.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { title?: string; approval_limit?: number } }) =>
      updateAdminCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      setEditingCategory(null);
      resetForm();
      setActionMsg({ type: "success", text: "Category updated successfully." });
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error || "Failed to update category.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAdminCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      setActionMsg({ type: "success", text: "Category intake status toggled." });
    },
    onError: (err: any) => {
      setActionMsg({ type: "error", text: err.response?.data?.error || "Failed to toggle status." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["adminMetrics"] });
      setActionMsg({ type: "success", text: "Category deleted successfully." });
    },
    onError: (err: any) => {
      setActionMsg({ type: "error", text: err.response?.data?.error || "Failed to delete category." });
    },
  });

  const resetForm = () => {
    setFormCode("");
    setFormTitle("");
    setFormLimit(100);
    setModalError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: JobCategory) => {
    setEditingCategory(cat);
    setFormCode(cat.code);
    setFormTitle(cat.title);
    setFormLimit(cat.approval_limit ?? 100);
    setModalError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formCode.trim() || !formTitle.trim()) {
      setModalError("Please provide both category code and title.");
      return;
    }
    if (formLimit <= 0) {
      setModalError("Quota limit must be a positive number.");
      return;
    }
    createMutation.mutate({
      code: formCode.trim().toUpperCase(),
      title: formTitle.trim(),
      approval_limit: Number(formLimit),
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setModalError(null);
    if (!formTitle.trim()) {
      setModalError("Category title is required.");
      return;
    }
    if (formLimit <= 0) {
      setModalError("Quota limit must be greater than zero.");
      return;
    }
    updateMutation.mutate({
      id: editingCategory.id,
      data: {
        title: formTitle.trim(),
        approval_limit: Number(formLimit),
      },
    });
  };

  const handleDelete = (cat: JobCategory) => {
    if (confirm(`Are you sure you want to permanently delete category "${cat.title}" (${cat.code})? This action cannot be undone.`)) {
      deleteMutation.mutate(cat.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Trade Category Management</h1>
              <p className="text-xs text-slate-500 font-medium">Dynamic CRUD and real-time intake control for registration categories</p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Category
        </button>
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold ${
            actionMsg.type === "success"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Categories Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 text-center">Sanctioned Quota</th>
                <th className="px-6 py-4 text-center">Approved</th>
                <th className="px-6 py-4 text-center">Remaining</th>
                <th className="px-6 py-4 text-center">Intake Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-16 mx-auto" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-rose-600 font-semibold text-sm">
                    Failed to load categories.
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 space-y-2">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">No categories found</p>
                    <p className="text-xs text-slate-500">Add a new category to get started.</p>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const limit = cat.approval_limit ?? 0;
                  const approved = cat.approved_count ?? 0;
                  const remaining = Math.max(0, limit - approved);

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {cat.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{cat.title}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">{limit}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-blue-700">{approved}</td>
                      <td className="px-6 py-4 text-center font-mono font-bold">
                        <span className={remaining > 0 ? "text-blue-700" : "text-rose-600"}>
                          {remaining}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            cat.is_approval_open
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.is_approval_open ? "bg-blue-600" : "bg-rose-600"
                            }`}
                          />
                          {cat.is_approval_open ? "Intake Open" : "Closed"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status */}
                          <button
                            title={cat.is_approval_open ? "Close Intake" : "Open Intake"}
                            onClick={() => toggleMutation.mutate(cat.id)}
                            disabled={toggleMutation.isPending}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            {cat.is_approval_open ? (
                              <ToggleRight className="w-5 h-5 text-blue-700" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Category Details & Limit"
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete Category"
                            onClick={() => handleDelete(cat)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Add New Trade Category</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MER-01, JQW-03"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Unique official trade designation code</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jacquard Weaver"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sanctioned Quota Limit *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formLimit}
                  onChange={(e) => setFormLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Maximum trainees permitted for admission under this trade</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {createMutation.isPending ? "Registering..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Edit Category: {editingCategory.code}</h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Code
                </label>
                <input
                  type="text"
                  disabled
                  value={formCode}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sanctioned Quota Limit *
                </label>
                <input
                  type="number"
                  required
                  min={editingCategory.approved_count ?? 1}
                  value={formLimit}
                  onChange={(e) => setFormLimit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Cannot be lower than current approved count ({editingCategory.approved_count ?? 0})
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition cursor-pointer"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

