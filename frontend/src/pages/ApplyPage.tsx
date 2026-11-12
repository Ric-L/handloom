import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories, submitApplication } from "../api";

export default function ApplyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = params.get("category") || "";

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const [form, setForm] = useState({
    category_id: initialCategory,
    full_name: "",
    guardian_name: "",
    dob: "",
    gender: "MALE",
    alt_mobile: "",
    gov_id_type: "Aadhaar",
    gov_id_last4: "",
    social_category: "GENERAL",
    address_full: "",
    district_state_pin: "",
    highest_qual: "CLASS_X",
    occupation: "UNEMPLOYED",
    training_mode: "CLASSROOM",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successRegNo, setSuccessRegNo] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => fd.append(key, val));
      const res = await submitApplication(fd);
      setSuccessRegNo(res.registration_no);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit application. Note: Only 1 application per category is allowed.");
    } finally {
      setLoading(false);
    }
  };

  if (successRegNo) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md border border-green-200 p-8 text-center my-8">
        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
          ✓
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
        <p className="text-gray-600 text-sm mb-6">
          Your registration has been saved. Please record your tamper-proof Registration Number:
        </p>
        <div className="bg-primary-50 border border-primary-200 text-primary-800 font-mono font-bold text-xl py-3 px-6 rounded-lg mb-6 inline-block">
          {successRegNo}
        </div>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-primary-700 hover:bg-primary-800 text-white font-medium px-5 py-2 rounded-lg text-sm transition"
          >
            Go to My Applications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-gray-100 p-8 my-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Skill Development Enrolment Form</h1>
        <p className="text-sm text-gray-500 mt-1">Please provide accurate personal and contact details</p>
      </div>

      {error && <div className="mb-6 text-red-700 text-sm bg-red-50 p-4 rounded-lg border border-red-200">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Job Role Category *</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">-- Choose Category --</option>
            {categories?.filter(c => c.is_approval_open).map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as per ID) *</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Father's / Guardian's Name *</label>
            <input
              type="text"
              name="guardian_name"
              value={form.guardian_name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Social Category *</label>
            <select
              name="social_category"
              value={form.social_category}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="GENERAL">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Govt ID Type *</label>
            <select
              name="gov_id_type"
              value={form.gov_id_type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="VoterID">Voter ID</option>
              <option value="PAN">PAN Card</option>
              <option value="ArtisanCard">Artisan Identity Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Govt ID (Last 4 Digits Only) *</label>
            <input
              type="text"
              name="gov_id_last4"
              value={form.gov_id_last4}
              onChange={handleChange}
              maxLength={4}
              pattern="\d{4}"
              placeholder="e.g. 5678"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Permanent Residential Address *</label>
          <textarea
            name="address_full"
            value={form.address_full}
            onChange={handleChange}
            required
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">District, State & PIN Code *</label>
          <input
            type="text"
            name="district_state_pin"
            value={form.district_state_pin}
            onChange={handleChange}
            placeholder="e.g. Varanasi, Uttar Pradesh - 221001"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification *</label>
            <select
              name="highest_qual"
              value={form.highest_qual}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="NO_FORMAL">No Formal Education</option>
              <option value="CLASS_V">Class V</option>
              <option value="CLASS_VIII">Class VIII</option>
              <option value="CLASS_X">Class X</option>
              <option value="CLASS_XII">Class XII</option>
              <option value="GRADUATE">Graduate</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Occupation *</label>
            <select
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="UNEMPLOYED">Unemployed</option>
              <option value="STUDENT">Student</option>
              <option value="SELF_EMPLOYED">Self Employed / Artisan</option>
              <option value="EMPLOYED">Employed</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-3 rounded-lg text-base shadow transition disabled:opacity-60"
        >
          {loading ? "Submitting Application..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}

