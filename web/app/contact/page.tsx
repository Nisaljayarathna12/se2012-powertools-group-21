import Link from "next/link"
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react"

const CHANNELS = [
  {
    icon: Phone,
    label: "Call us",
    value: "+94 77 123 4567",
    href: "tel:+94771234567",
  },
  {
    icon: Mail,
    label: "Email us",
    value: "sales@jayarathnahardware.lk",
    href: "mailto:sales@jayarathnahardware.lk",
  },
  {
    icon: MapPin,
    label: "Visit our store",
    value: "No. 142, Main Street, Colombo 03, Sri Lanka",
    href: "https://maps.google.com/?q=Colombo+Sri+Lanka",
  },
]

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl animate-fade-in bg-industrial-50 px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-industrial-900">
          Contact Us
        </h1>
        <p className="mt-1 text-industrial-500">
          Our team is ready to help you choose the right tool for your project
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            target={channel.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="card group flex flex-col p-6 hover:border-safety-400 hover:shadow-elevated"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-industrial-100 text-industrial-700 transition-colors group-hover:bg-safety-500 group-hover:text-industrial-900">
              <channel.icon size={24} />
            </div>
            <h2 className="text-sm font-semibold text-industrial-800 group-hover:text-safety-600">
              {channel.label}
            </h2>
            <p className="mt-1 text-sm text-industrial-500">{channel.value}</p>
          </a>
        ))}
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-industrial-900">
          Store hours
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {[
            ["Monday – Friday", "8:00 AM – 6:00 PM"],
            ["Saturday", "8:00 AM – 4:00 PM"],
            ["Sunday", "Closed"],
            ["Poya days", "Closed"],
          ].map(([day, hours]) => (
            <div
              key={day}
              className="flex items-center justify-between rounded-lg border border-industrial-200 px-4 py-3"
            >
              <dt className="font-medium text-industrial-700">{day}</dt>
              <dd className="text-industrial-500">{hours}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-xl bg-industrial-800 p-6 sm:flex-row">
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Looking for a specific tool?
            </h3>
            <p className="mt-1 text-industrial-300">
              Browse the catalogue to check live stock and pricing.
            </p>
          </div>
          <Link href="/catalog" className="btn-primary shrink-0">
            Browse Catalog <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  )
}
