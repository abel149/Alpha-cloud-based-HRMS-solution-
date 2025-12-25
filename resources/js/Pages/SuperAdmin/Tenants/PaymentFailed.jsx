import React from 'react';
import { Link } from '@inertiajs/inertia-react';

export default function PaymentFailed() {
  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Payment Failed!</h1>
      <p>Something went wrong with your payment. Please try again.</p>
      <Link href="/tenant/apply" className="text-blue-600 underline mt-4 block">
        Retry
      </Link>
    </div>
  );
}
