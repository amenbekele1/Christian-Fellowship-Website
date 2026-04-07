import { Metadata } from "next";
import { MapPin, Clock, Phone, Mail, Bus, Train } from "lucide-react";

export const metadata: Metadata = { title: "Visit Us" };

export default function VisitPage() {
  return (
    <>
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 eth-stripe" />
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <p className="text-amber-300 text-sm font-semibold uppercase tracking-widest mb-4">We'd Love to See You</p>
          <h1 className="font-display text-5xl font-bold text-white mb-5">Visit Us</h1>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
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
              <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">Our Location</h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Warsaw Ethiopian Christian Fellowship<br />
                  Warsaw, Poland<br />
                  <span className="text-gray-400 text-sm">(Contact us for exact address)</span>
                </p>
              </div>

              {/* Service times */}
              <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">Service Times</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    { day: "Saturday", time: "10:00 AM – 1:00 PM", label: "Main Service" },
                    { day: "Sunday", time: "10:00 AM – 12:00 PM", label: "Worship & Word" },
                    { day: "Wednesday", time: "7:00 PM – 9:00 PM", label: "Bible Study" },
                  ].map((s) => (
                    <li key={s.day} className="flex items-center justify-between py-2 border-b border-green-50 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{s.day}</p>
                        <p className="text-xs text-green-600">{s.label}</p>
                      </div>
                      <span className="text-sm text-gray-500 font-medium">{s.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 text-lg">Get In Touch</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href="mailto:info@wecf.org" className="hover:text-green-700 transition-colors">info@wecf.org</a>
                  </li>
                  <li className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href="tel:+48123456789" className="hover:text-green-700 transition-colors">+48 123 456 789</a>
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
              <div className="rounded-2xl overflow-hidden border border-green-100 shadow-sm h-full min-h-[500px] bg-green-50 flex flex-col">
                {/* Embed Google Maps — Warsaw city centre */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d78991.75814!2d20.9217!3d52.2297!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471ecc669a869f01%3A0x72f0be2a88ead3fc!2sWarsaw%2C%20Poland!5e0!3m2!1sen!2s!4v1700000000000"
                  className="w-full flex-1"
                  style={{ border: 0, minHeight: "460px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="p-4 bg-white border-t border-green-100">
                  <p className="text-sm text-gray-500 text-center">
                    📍 Warsaw, Poland · Contact us for the exact address of our fellowship hall
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* First time visitor */}
      <section className="py-14 bg-green-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">First Time Visiting?</h2>
          <p className="text-green-200 leading-relaxed mb-8">
            You will be warmly welcomed! Our services are conducted in Amharic and English. Dress
            comfortably, come with an open heart, and expect to be blessed. We would love to meet you.
          </p>
          <a
            href="/register"
            className="inline-block bg-amber-400 text-green-900 font-bold px-8 py-3.5 rounded-xl hover:bg-amber-300 transition-colors"
          >
            Register as a New Member
          </a>
        </div>
      </section>
    </>
  );
}
