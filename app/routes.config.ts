export interface AppRoute {
  path: string
  label: string
  icon?: string
  menu?: boolean
  pattern?: string[] // For matching multiple patterns
}

export const ROUTES = {
  LANDING: { path: '/', label: 'Home', menu: false },
  MAKE: { path: '/make', label: 'Create', menu: true },
  TANKS: { path: '/tanks', label: 'Join', menu: true },
  TANK: {
    path: '/tank/:id',
    label: 'Engage',
    menu: true,
    pattern: ['/tank/', '/minted']  // Both tank and minted routes activate Engage
  },
  MINTED: { path: '/minted', label: 'Minted', menu: false }, // Hide from menu since it's part of Engage
  SHARE: { path: '/share/:id/:action', label: 'Share', menu: false },
  NOT_FOUND: { path: '/404', label: 'Not Found', menu: false }
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]['path']
