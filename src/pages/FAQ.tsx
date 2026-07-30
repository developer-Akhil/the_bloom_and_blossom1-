import React from 'react';

export function FAQ() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col pt-32 pb-20">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-gray-100 shadow-sm space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900">Frequently Asked Questions</h1>
            <p className="text-gray-500 text-lg">Got inquiries? See if your question is answered below.</p>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-2">Do you offer custom designs?</h3>
              <p className="text-gray-600">Yes, we specialize in customised name bows and customized scrunchies. Please reach out to us with your requirements or select the customized options from our collections.</p>
            </div>
            
            <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-2">How can I track my order?</h3>
              <p className="text-gray-600">Once your order is shipped, we will send an email with a tracking link. You can also view your order status inside your customer dashboard.</p>
            </div>
            
            <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-2">Can I modify my order after placing it?</h3>
              <p className="text-gray-600">Since we process orders quickly, please contact us within 24 hours if you need any adjustments to your order.</p>
            </div>
            
            <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50">
              <h3 className="font-bold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept major credit/debit cards and supported local payment methods like UPI. Check the checkout page for exact available methods.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
