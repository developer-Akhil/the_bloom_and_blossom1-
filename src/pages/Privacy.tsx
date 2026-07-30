import React from 'react';
import { siteConfig } from '../config/site';

export function Privacy() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col pt-32 pb-20">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] p-10 md:p-16 border border-gray-100 shadow-sm space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900">Privacy Policy</h1>
            <p className="text-gray-500 text-lg">How we collect, use, and protect your information.</p>
          </div>

          <div className="prose prose-gray max-w-none text-gray-600 space-y-6 leading-relaxed">
            <p>
              At {siteConfig.name} (managed by Priyanka Bisht Chand), we are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Third-Party Links</h3>
            <p>
              Our website may contain links to external websites. We are not responsible for the privacy practices of such sites and encourage you to review their policies.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Children's Privacy</h3>
            <p>
              Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.
            </p>

            <h3 className="font-bold text-gray-900 text-xl mt-8 mb-4">Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, you can contact us at:{' '}
              <a href={`mailto:${siteConfig.contact.email}`} className="text-bloom-rose hover:underline">
                {siteConfig.contact.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
