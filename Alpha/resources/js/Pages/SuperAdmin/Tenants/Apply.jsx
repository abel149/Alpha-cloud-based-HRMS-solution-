import React, { useState } from 'react';
import axios from 'axios';

export default function ApplyTenant() {
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    plan: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('/tenant/apply', form, {
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });

      if (res.data.checkout_url) {
        // redirect to Chapa
        window.location.href = res.data.checkout_url;
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Payment initialization failed');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Tenant Application</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Company Name</label>
          <input
            type="text"
            name="company_name"
            value={form.company_name}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Plan</label>
          <select
            name="plan"
            value={form.plan}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select a plan</option>
            <option value="basic">Basic - 500 ETB</option>
            <option value="pro">Pro - 1000 ETB</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply & Pay
        </button>
      </form>
    </div>
  );
}
