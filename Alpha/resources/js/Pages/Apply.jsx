import React, { useState } from 'react';
import axios from 'axios';
import { FiBriefcase, FiMail, FiDollarSign, FiArrowRight, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';

export default function ApplyTenant() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    plan: 'basic',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-auto text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-blue-600 dark:text-blue-400 text-4xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Application Submitted Successfully!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
            Thank you for your interest in our platform. We've received your application and will review it shortly.
            Our team will contact you at <span className="font-medium text-blue-600 dark:text-blue-400">{form.email}</span> with the next steps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-transform hover:scale-105"
            >
              Return to Home <FiArrowRight className="ml-2" />
            </a>
            <a
              href={route('welcome')}
              className="inline-flex items-center justify-center bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 px-8 py-3 rounded-lg text-lg font-medium transition-transform hover:scale-105"
            >
              <FiArrowLeft className="mr-2" /> Back to Welcome
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl mb-4">
            Get Started with Our Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Fill out the form below to apply for a tenant account. We'll review your application and get back to you soon.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* Company Name Field */}
                <div className="relative">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Company Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiBriefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="company_name"
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="Acme Inc."
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                    Business Email
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                {/* Plan Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Choose Your Plan
                  </label>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    {[
                      { id: 'basic', name: 'Basic', price: '$29', features: ['Up to 10 employees', 'Basic features'], recommended: false },
                      { id: 'pro', name: 'Professional', price: '$99', features: ['Up to 50 employees', 'Advanced features'], recommended: true },
                      { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Unlimited employees', 'All features', 'Dedicated support'] }
                    ].map((plan) => (
                      <div 
                        key={plan.id}
                        className={`relative border rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                          form.plan === plan.id 
                            ? 'ring-2 ring-blue-500 border-transparent bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } ${plan.recommended ? 'ring-2 ring-blue-500' : ''}`}
                        onClick={() => setForm({...form, plan: plan.id})}
                      >
                        {plan.recommended && (
                          <span className="absolute -top-2 right-4 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                            Recommended
                          </span>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                          {plan.price !== 'Custom' && <span className="text-gray-500 dark:text-gray-400">/month</span>}
                        </div>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <FiCheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                              <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                  <a
                    href="/"
                    className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <FiArrowLeft className="mr-2" /> Back to Welcome
                  </a>
                </div>
                <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  By submitting this form, you agree to our{' '}
                  <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
