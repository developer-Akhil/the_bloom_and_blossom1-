import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Returns() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl space-y-8 min-h-[70vh]">
      <Link to="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-bloom-rose transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Home
      </Link>
      <div className="space-y-4">
        <h1 className="font-serif text-5xl font-bold">Returns & Refunds</h1>
        <p className="text-gray-400">Policies for our handcrafted small business.</p>
      </div>

      <div className="bg-bloom-pink/20 border border-bloom-pink p-8 rounded-[2rem] space-y-6">
        <div className="flex items-center space-x-3 text-bloom-rose">
          <AlertCircle size={24} />
          <h2 className="font-serif text-2xl font-bold">No Returns or Refunds Available</h2>
        </div>
        
        <div className="space-y-6 text-gray-600 leading-relaxed font-light">
          <p>
            Thank you for shopping with The Bloom & Blossom! As a small, hand-crafted business where each piece is made to order and carefully inspected before shipping, <strong>we are unfortunately unable to offer returns, refunds, or exchanges at this time.</strong>
          </p>
          <p>
            We pride ourselves on the quality and delicate details of our hair accessories, and we want you to love your purchase. By completing your purchase, you acknowledge and agree to this final sale policy.
          </p>
          <p className="font-bold text-gray-800">
            We sincerely appreciate your understanding and continued support for our small business!
          </p>
        </div>
      </div>
    </div>
  );
}
