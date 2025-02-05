export interface AppRoute {
  path: string
  label: string
  icon?: string
  menu?: boolean
}

export const ROUTES = {
  LANDING: { path: '/', label: 'Landing', menu: false },
  MAKE: { path: '/make', label: 'Make', menu: true },
  TANKS: { path: '/tanks', label: 'Join', menu: true },
  TANK: { path: '/tank/:id', label: 'Join', menu: false },
  SHARE: { path: '/share/:id/:action', label: 'Share', menu: false }
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]['path']
