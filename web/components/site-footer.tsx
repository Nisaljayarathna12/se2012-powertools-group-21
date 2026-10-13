import Link from "next/link"
import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Video,
  Wrench,
} from "lucide-react"

/**
 * Store contact details and social handles are placeholders carried over from
 * the Bolt template. Replace the href values on the social links with the real
 * account URLs before going live.
 */

const SOCIAL_LINKS = [
  { label: "Facebook", href: "#", icon: Share2 },
  { label: "Instagram", href: "#", icon: MessageCircle },
  { label: "YouTube", href: "#", icon: Video },
]

const SUPPORT_LINKS = [
  { label: "Contact Us", href: "/contact" },
  { label: "Warranty Information", href: "/warranty" },
  { label: "Track Your Order", href: "/catalog" },
  { label: "Returns & Exchange", href: "/contact" },
]

const iconButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-lg bg-industrial-800 text-industrial-300 transition-colors hover:bg-safety-500 hover:text-industrial-900"

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-industrial-900 text-industrial-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Store info */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-safety-500">
                <Wrench size={22} className="text-industrial-900" />
              </div>
              <div>
                <div className="font-display text-lg font-bold text-white">
                  JAYARATHNA
                </div>
                <div className="text-xs text-safety-400">Hardware &amp; Tools</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-industrial-400">
              Your trusted source for genuine power tools and hardware in Sri
              Lanka. Authorized dealer for Bosch, Men , Makita, DeWalt, and Ingco.
            </p>
          </div>

          {/* Customer support */}
          <div>
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Customer Support
            </h3>
            <ul className="space-y-2 text-sm">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-safety-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Store location */}
          <div>
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Store Location
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 shrink-0 text-safety-400" />
                <span>F/5/1,Polambegoda,ussapitiya</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0 text-safety-400" />
                <span>+94 76 677 3047 / +94 35 225 9285</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0 text-safety-400" />
                <span>info@jayarathnapowertools@gmail.com</span>
              </li>
            </ul>
          </div>

          {/* Social + warranty */}
          <div>
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wide text-white">
              Follow Us
            </h3>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={iconButtonClass}
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-safety-600/30 bg-safety-500/10 p-3">
              <p className="text-xs font-medium text-safety-400">
                All products come with genuine manufacturer warranty
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-industrial-800">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-industrial-500">
          &copy; {new Date().getFullYear()} Jayarathna Hardware &amp; Tools.
          All rights reserved. Sri Lanka.
        </div>
      </div>
    </footer>
  )
}
