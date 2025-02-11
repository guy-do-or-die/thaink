import { Link } from 'wouter'

import { ROUTES } from '../routes.config'

import { useNavigation } from '@/hooks/useNavigation'


export default function NotFound() {
  const { navigateTo } = useNavigation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-gray-600 mb-8">¯\_(ツ)_/¯</p>
      <Link href={ROUTES.LANDING.path} className="cursor-pointer">
        Back
      </Link>
    </div>
  )
}
