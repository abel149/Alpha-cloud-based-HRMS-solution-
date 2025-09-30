import React from 'react';
import { Link } from '@inertiajs/inertia-react';

export default function PaymentSuccess() {
  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Payment Successful!</h1>
      <p>Your tenant application has been processed successfully.</p>
      <Link href="/tenant/apply" className="text-blue-600 underline mt-4 block">
        Apply another tenant
      </Link>
    </div>
  );
}
