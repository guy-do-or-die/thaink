export interface AppRoute {
  path: string
  label: string
  icon?: string
  menu?: boolean
}

export const ROUTES = {
  LANDING: { path: '/', label: 'Landing', menu: false },
  MAKE: { path: '/make', label: 'Make', menu: true },
  TANKS: { path: '/tanks', label: 'Tanks', menu: true },
  THINK: { path: '/think', label: 'Think', menu: true }
} as const

export type RoutePath = typeof ROUTES[keyof typeof ROUTES]['path']
