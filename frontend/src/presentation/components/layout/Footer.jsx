import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card/50 border-t border-border mt-auto backdrop-blur-sm p-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-20 pb-16">

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start">

          {/* Col 1 — Brand & Description */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <img src="/ilm-ora-logo.png" alt="ILM-ORA Logo" className="w-9 h-9" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-wide">
                ILM-ORA
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              AI-powered career guidance and university recommendation platform. Discover your ideal career path with our intelligent system.
            </p>
          </div>

          {/* Col 2 — Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { label: "About Us", to: "/about" },
                { label: "Career Quiz", to: "/quiz-intro" },
                { label: "Universities", to: "/universities" },
                { label: "Careers", to: "/careers" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Contact Us */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-widest mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <span className="leading-relaxed">H11, Islamabad, Pakistan</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                <span>+92-3191938242</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                <span className="break-all">taimoorrazaasif581@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className=" mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} ILM-ORA. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy Policy</Link>
            <Link to="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">Terms of Service</Link>
            <Link to="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
