import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api";
import { Link } from "react-router-dom";

export default function CategoriesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  if (isLoading) return <div className="text-center py-16 text-gray-400">Loading artisan categories...</div>;

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-800">Job Role Categories & Quotas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Government certified training courses under Handloom & Skilled Artisan Development.
          Maximum of 1 application per artisan per category.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map(cat => {
          const remaining = Math.max(0, cat.approval_limit - cat.approved_count);
          return (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono font-bold text-primary-800 bg-primary-50 px-2 py-1 rounded">
                    {cat.code}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cat.is_approval_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {cat.is_approval_open ? "Applications Open" : "Quota Closed"}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-snug mb-4">{cat.title}</h3>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs text-gray-600 mb-6">
                  <div className="flex justify-between">
                    <span>Approved / Total Quota:</span>
                    <span className="font-semibold text-gray-800">{cat.approved_count} / {cat.approval_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Capacity:</span>
                    <span className="font-semibold text-primary-700">{remaining} candidates</span>
                  </div>
                </div>
              </div>

              <div>
                {cat.is_approval_open ? (
                  <Link
                    to={`/apply?category=${cat.id}`}
                    className="block w-full text-center bg-primary-700 hover:bg-primary-800 text-white font-medium py-2 rounded-lg text-sm transition"
                  >
                    Apply for this Role
                  </Link>
                ) : (
                  <button disabled className="w-full bg-gray-200 text-gray-500 font-medium py-2 rounded-lg text-sm cursor-not-allowed">
                    Quota Full
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

