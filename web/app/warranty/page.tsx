import { Check, RotateCcw, Shield, Wrench } from "lucide-react"

const SECTIONS = [
  {
    icon: Shield,
    title: "Manufacturer Warranty",
    body: "All power tools carry a 1-year manufacturer warranty covering defects in materials and workmanship. The warranty runs from the date of purchase and requires the original receipt.",
  },
  {
    icon: Check,
    title: "What's Covered",
    points: [
      "Manufacturing defects in the motor and components",
      "Battery and charger defects on cordless models",
      "Replacement of faulty parts at no cost",
    ],
  },
  {
    icon: RotateCcw,
    title: "7-Day Returns",
    body: "Unused products in their original packaging can be returned within 7 days of purchase for a full refund, subject to a restocking inspection.",
  },
  {
    icon: Wrench,
    title: "Genuine Parts & Repairs",
    body: "Genuine replacement parts and accessories are available for every model we stock. Contact the store for parts ordering and repair services.",
  },
]

export default function WarrantyPage() {
  return (
    <div className="mx-auto max-w-4xl animate-fade-in bg-industrial-50 px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-industrial-900">
          Brand Warranty
        </h1>
        <p className="mt-1 text-industrial-500">
          Coverage, returns and service for every tool we sell
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="card flex flex-col p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-safety-500 text-industrial-900">
              <section.icon size={24} />
            </div>
            <h2 className="text-lg font-bold text-industrial-800">
              {section.title}
            </h2>
            {section.body ? (
              <p className="mt-2 text-sm leading-relaxed text-industrial-600">
                {section.body}
              </p>
            ) : null}
            {section.points ? (
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-industrial-600">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
