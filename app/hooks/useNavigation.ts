import { RoutePath } from '@/routes.config'
import { useLocation } from 'wouter'

export function useNavigation() {
  const [location, setLocation] = useLocation()

  const navigateTo = (path: RoutePath) => {
    setLocation(path)
  }

  return { navigateTo, location }
}
