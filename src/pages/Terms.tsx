import React from 'react';
import { siteConfig } from '../config/site';

export function Terms() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col pt-32 pb-20">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-gray-100 shadow-sm space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900">Terms and Conditions</h1>
            <p className="text-gray-500 text-lg">Welcome to bloomandblossom.in</p>
          </div>

          <div className="prose prose-gray max-w-none text-gray-600 space-y-6 leading-relaxed">
            <p>
              Welcome to bloomandblossom.in (managed by Priyanka Bisht Chand). By accessing or using our website, you agree to comply with and be bound by the following Terms and Conditions.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Use of Website</h3>
            <p>
              You agree to use this website only for lawful purposes and in a way that does not violate any applicable laws or regulations.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Products/Services</h3>
            <p>
              All products or services listed on the website are subject to availability. bloomandblossom.in reserves the right to modify or discontinue any product/service without prior notice.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Pricing and Payments</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>All prices are listed in INR (₹) unless stated otherwise.</li>
              <li>{siteConfig.name} reserves the right to change pricing at any time without prior notice.</li>
              <li>Payments must be completed before order processing.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Order Acceptance & Cancellation</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>bloomandblossom.in reserves the right to refuse or cancel any order at its discretion.</li>
              <li>Orders may be cancelled due to pricing errors, stock issues, or suspected fraud.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Shipping & Delivery</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Delivery timelines are 5-6 days.</li>
              <li>bloomandblossom.in is not responsible for delays caused by courier partners or unforeseen circumstances.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Intellectual Property</h3>
            <p>
              All content on this website (text, images, logos, designs) is the property of bloomandblossom.in and is protected by applicable copyright laws. Unauthorized use is prohibited.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">User Accounts</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account details.</li>
              <li>bloomandblossom.in is not liable for unauthorized access due to your negligence.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Limitation of Liability</h3>
            <p>
              {siteConfig.name} is not liable for any indirect, incidental, or consequential damages arising from the use of the website or products.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Third-Party Links</h3>
            <p>
              The website may contain links to third-party websites. {siteConfig.name} is not responsible for their content or policies.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Privacy</h3>
            <p>
              Your use of the website is also governed by our Privacy Policy.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Changes to Terms</h3>
            <p>
              {siteConfig.name} reserves the right to update these Terms at any time. Continued use of the website constitutes acceptance of the updated Terms.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Governing Law</h3>
            <p>
              These Terms shall be governed by and interpreted in accordance with the laws of India.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Contact Us</h3>
            <p>
              If you have any questions, please contact us at:<br/>
              Email: <a href={`mailto:${siteConfig.contact.email}`} className="text-bloom-rose hover:underline">{siteConfig.contact.email}</a><br/>
              Number: {siteConfig.contact.phone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
