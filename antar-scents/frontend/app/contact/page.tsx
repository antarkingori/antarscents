'use client';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, MessageCircle, Send, Loader2, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Compose a WhatsApp message as the submission channel
    const text = `*Contact Form — Antar Scents*\n\n*Name:* ${form.name}\n*Email:* ${form.email}\n*Subject:* ${form.subject}\n\n*Message:*\n${form.message}`;
    window.open(`https://wa.me/254792274842?text=${encodeURIComponent(text)}`, '_blank');
    setLoading(false);
    setSent(true);
  };

  const INFO = [
    { icon: <Phone size={20} className="text-gold" />, label: 'Phone', value: '+254 792 274 842', href: 'tel:+254792274842' },
    { icon: <Mail size={20} className="text-gold" />, label: 'Email', value: 'info@antarscents.shop', href: 'mailto:info@antarscents.shop' },
    { icon: <MessageCircle size={20} className="text-gold" />, label: 'WhatsApp', value: 'Chat with us instantly', href: 'https://wa.me/254792274842?text=Hi%20Antar%20Scents!%20I%20have%20an%20enquiry.' },
    { icon: <MapPin size={20} className="text-gold" />, label: 'Location', value: 'Nairobi, Kenya', href: null },
    { icon: <Clock size={20} className="text-gold" />, label: 'Hours', value: 'Mon–Sat, 8 AM – 8 PM EAT', href: null },
  ];

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-widest uppercase mb-3">Get in Touch</p>
          <h1 className="font-playfair text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-400">Have a question, need a recommendation, or want to place a custom order? We&apos;d love to hear from you.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* Contact info */}
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8">
              <h2 className="font-playfair text-xl font-semibold mb-6">Reach Us Directly</h2>
              <ul className="space-y-5">
                {INFO.map(item => (
                  <li key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-white hover:text-gold transition-colors text-sm font-medium">{item.value}</a>
                      ) : (
                        <p className="text-white text-sm font-medium">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1a1400] to-[#0a0a0a] border border-[#2a2000] rounded-2xl p-8">
              <h3 className="font-playfair text-lg font-semibold mb-2">Fastest Response</h3>
              <p className="text-gray-400 text-sm mb-4">For the quickest answer, message us on WhatsApp. Our team typically responds within minutes during business hours.</p>
              <a
                href="https://wa.me/254792274842?text=Hi%20Antar%20Scents!%20I%20have%20an%20enquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
              >
                <MessageCircle size={16} /> Open WhatsApp
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8">
            <h2 className="font-playfair text-xl font-semibold mb-6">Send a Message</h2>

            {sent ? (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h3 className="font-playfair text-lg font-semibold">Message Sent via WhatsApp</h3>
                <p className="text-gray-400 text-sm">Your message has been opened in WhatsApp. We&apos;ll reply as soon as possible.</p>
                <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }} className="text-gold hover:underline text-sm">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                    <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-dark" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                    <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-dark" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Subject</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required className="input-dark">
                    <option value="">Select a topic...</option>
                    <option>Order enquiry</option>
                    <option>Product recommendation</option>
                    <option>Delivery issue</option>
                    <option>Return / exchange</option>
                    <option>Bulk / wholesale order</option>
                    <option>Gift order</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Message</label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="input-dark resize-none" placeholder="Tell us how we can help you..." />
                </div>
                <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Opening WhatsApp...</> : <><Send size={16} /> Send via WhatsApp</>}
                </button>
                <p className="text-gray-500 text-xs text-center">This will open WhatsApp with your message pre-filled. Alternatively, email us directly at <a href="mailto:info@antarscents.shop" className="text-gold hover:underline">info@antarscents.shop</a></p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
