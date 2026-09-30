export interface SectionLink {
  id: string
  label: string
}

interface SectionNavProps {
  links: SectionLink[]
}

export function SectionNav({ links }: SectionNavProps) {
  return (
    <nav
      aria-label="Secciones"
      data-testid="section-nav"
      className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-2 backdrop-blur print:hidden"
    >
      <ul className="flex gap-1 overflow-x-auto">
        {links.map((link) => (
          <li key={link.id} className="shrink-0">
            <a
              href={`#${link.id}`}
              className="block rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-white hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
