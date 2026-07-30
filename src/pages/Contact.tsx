import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { siteConfig } from '../config/site';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const [errorMessage, setErrorMessage] = useState('Failed to send message. Please try again later.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('Failed to send message. Please try again later.');

    try {
      const response = await fetch(`/api/contact`, {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
        })
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
      } else {
        setStatus('error');
        try {
          const errData = await response.json();
          if (errData.error) {
            setErrorMessage(errData.error);
          }
        } catch(e) {}
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus('error');
    }
  };

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative py-20 bg-bloom-pink/30 floral-gradient">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h1 className="font-serif text-5xl md:text-6xl font-bold">Get in Touch</h1>
          <p className="text-gray-500 max-w-xl mx-auto text-lg font-light">
            Have a question about our collections or need help with a custom order? We're here to help you bloom.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Info */}
          <div className="lg:col-span-1 space-y-8">
            <ContactInfoCard 
              icon={<Phone />} 
              title="Call Us" 
              desc={siteConfig.contact.phoneDisplay} 
              sub="Mon - Sat, 10am - 6pm" 
            />
            <ContactInfoCard 
              icon={<Mail />} 
              title="Email Us" 
              desc={siteConfig.contact.email} 
              sub="We reply within 24 hours" 
            />
            <ContactInfoCard 
              icon={<MapPin />} 
              title="Visit Us" 
              desc={<>{siteConfig.contact.address.line1}<br/>{siteConfig.contact.address.line2}</>} 
              sub="Open for pickup by appt." 
            />
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl shadow-bloom-pink/20 border border-gray-50 space-y-12">
            <div className="space-y-4">
              <h2 className="font-serif text-3xl font-bold">Send a Message</h2>
              <p className="text-gray-400 font-light">Our team typically responds to inquiries within one business day.</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Name</label>
                <input 
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20 transition-all text-gray-900" 
                  placeholder="Enter your name" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <input 
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20 transition-all text-gray-900" 
                  placeholder="Enter your email" 
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">How can we help?</label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20 transition-all appearance-none cursor-pointer text-gray-900"
                >
                  <option>General Inquiry</option>
                  <option>Customised Order Request</option>
                  <option>Shipping & Delivery</option>
                  <option>Returns & Refunds</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Message</label>
                <textarea 
                  name="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-8 py-5 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20 transition-all min-h-[150px] text-gray-900 resize-y" 
                  placeholder="Tell us more..."
                ></textarea>
              </div>
              <div className="md:col-span-2 space-y-4">
                {status === 'success' && (
                  <div className="p-4 bg-green-50 text-green-700 rounded-2xl flex items-center space-x-3 text-sm font-medium">
                    <CheckCircle2 size={18} />
                    <span>Message sent successfully! We will get back to you soon.</span>
                  </div>
                )}
                {status === 'error' && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center space-x-3 text-sm font-medium">
                    <XCircle size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={status === 'submitting'}
                  className="h-16 px-12 bg-bloom-rose text-white rounded-full font-bold shadow-xl shadow-bloom-rose/20 hover:scale-105 transition-all flex items-center justify-center space-x-3 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactInfoCard({ icon, title, desc, sub }: { icon: React.ReactNode, title: string, desc: React.ReactNode, sub: string }) {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-6">
       <div className="w-12 h-12 bg-bloom-pink rounded-2xl flex items-center justify-center text-bloom-rose">
         {icon}
       </div>
       <div className="space-y-1">
         <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400">{title}</h4>
         <p className="text-xl font-bold">{desc}</p>
         <p className="text-xs text-gray-400">{sub}</p>
       </div>
    </div>
  );
}
