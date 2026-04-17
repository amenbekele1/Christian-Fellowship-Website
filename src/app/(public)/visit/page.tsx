"use client";

import { useState } from "react";
import { MapPin, Clock, Phone, Mail, Bus, Train, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function VisitPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };
  return (
    <>
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">We'd Love to See You</p>
          <h1 className="font-display text-5xl font-bold text-white mb-5">Visit Us</h1>
          <p className="text-brown-100 text-lg max-w-2xl mx-auto">
            Our doors are always open. Come as you are and experience the warmth of our fellowship.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Info cards */}
            <div className="lg:col-span-2 space-y-5">
              {/* Location */}
              <div className="bg-white border border-brown-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brown-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-gold-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">Our Location</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Warsaw Ethiopian Christian Fellowship<br />
                  <strong>Naddnieprzańska 7</strong><br />
                  04-205 Warszawa, Poland
                </p>
                <a
                  href="https://maps.google.com/?q=Naddnieprzańska+7,+04-205+Warszawa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-gold-500 font-medium hover:underline"
                >
                  Open in Google Maps →
                </a>
              </div>

              {/* Service times */}
              <div className="bg-white border border-brown-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">Service Times</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    { day: "Saturday", time: "18:00", label: "Main Service" },
                  ].map((s) => (
                    <li key={s.day} className="flex items-center justify-between py-2 border-b border-brown-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{s.day}</p>
                        <p className="text-xs text-gold-600">{s.label}</p>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">{s.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="bg-white border border-brown-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">Get In Touch</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href="mailto:info@wetcf.com" className="hover:text-gold-500 transition-colors">info@wetcf.com</a>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href="tel:+48123456789" className="hover:text-gold-500 transition-colors">+48 123 456 789</a>
                  </li>
                </ul>
              </div>

              {/* How to get there */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <h3 className="font-display font-bold text-gray-800 text-lg mb-4">Getting Here</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-gray-600">
                    <Bus className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>Bus routes 111, 222 — stop at <strong>Central Warsaw</strong></span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-600">
                    <Train className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>Metro Line 1 — <strong>Centrum</strong> station, 5 min walk</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>Street parking available on surrounding streets</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden border border-brown-200 shadow-sm h-full min-h-[500px] bg-brown-50 flex flex-col">
                {/* Embed Google Maps — Warsaw city centre */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2445.123!2d21.0722!3d52.2185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471eccf5b5f0b0b3%3A0x1!2sNaddnieprzańska+7%2C+04-205+Warszawa!5e0!3m2!1sen!2spl!4v1700000000000"
                  className="w-full flex-1"
                  style={{ border: 0, minHeight: "460px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="p-4 bg-white border-t border-brown-200">
                  <p className="text-sm text-gray-500 text-center">
                    📍 Naddnieprzańska 7, 04-205 Warszawa · Saturdays at 18:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-brown-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-gold-600 text-sm font-semibold uppercase tracking-widest mb-3">Get In Touch</p>
            <h2 className="font-display text-3xl font-bold text-gray-800 mb-3">Send Us a Message</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Have a question or want to know more about our fellowship? Our leaders will get back to you personally.
            </p>
          </div>

          {status === "sent" ? (
            <div className="bg-white border border-green-200 rounded-2xl p-10 text-center shadow-sm">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h3 className="font-display font-bold text-gray-800 text-xl mb-2">Message Sent!</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Thank you for reaching out. One of our leaders will reply to you shortly. Check your inbox for a confirmation.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm text-gold-600 hover:text-gold-700 font-medium underline underline-offset-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brown-200 shadow-sm p-8">
              {status === "error" && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name *</label>
                    <input
                      type="text" required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                      className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                    <input
                      type="email" required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                  <input
                    type="text" required
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="What is this about?"
                    className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                  <textarea
                    required rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    placeholder="Write your message here..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                  style={{ background: "#1C0F07", color: "#FAF7F0" }}
                >
                  {status === "sending" ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* First time visitor */}
      <section className="py-14 bg-brown-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">First Time Visiting?</h2>
          <p className="text-brown-200 leading-relaxed mb-8">
            You will be warmly welcomed! Our services are conducted in Amharic and English. Dress
            comfortably, come with an open heart, and expect to be blessed. We would love to meet you.
          </p>
          <a
            href="/register"
            className="inline-block bg-amber-400 text-brown-800 font-bold px-8 py-3.5 rounded-xl hover:bg-amber-300 transition-colors"
          >
            Register as a New Member
          </a>
        </div>
      </section>
    </>
  );
}
