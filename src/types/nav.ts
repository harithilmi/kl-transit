export type PresetLinkKey =
  | 'home'
  | 'routes'
  | 'stops'
  | 'dashboard'
  | 'editor'
  | 'trips'

export interface CustomLink {
  href: string
  label: string
  translateLabel?: boolean
}

export type LinkItem = PresetLinkKey | CustomLink
