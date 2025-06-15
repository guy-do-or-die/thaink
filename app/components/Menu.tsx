import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu'
import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'
import { Button } from '@/components/ui/button'
import { Sparkles, Send, Users } from 'lucide-react'

const MENU_ICONS = {
  Create: <Sparkles className="h-5 w-5" />,
  Join: <Users className="h-5 w-5" />,
  Engage: <Send className="h-5 w-5" />,
}

export default function Menu() {
  const { navigateTo, location } = useNavigation()

  const isRouteActive = (route: (typeof ROUTES)[keyof typeof ROUTES]) => {
    if (route.pattern) {
      return route.pattern.some((pattern) => location.startsWith(pattern))
    }
    return location === route.path
  }

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-2">
        {Object.values(ROUTES)
          .filter((route) => route.menu)
          .map((route) => {
            const handleClick = route.pattern ? () => navigateTo(ROUTES.MINTED.path) : () => navigateTo(route.path)

            return (
              <NavigationMenuItem key={route.path}>
                <Button
                  onClick={handleClick}
                  variant={isRouteActive(route) ? 'default' : 'ghost'}
                  className={`gap-2 ${isRouteActive(route) ? 'bg-primary text-primary-foreground' : ''}`}
                  size="default"
                >
                  {MENU_ICONS[route.label as keyof typeof MENU_ICONS]}
                  <span className="md:inline max-md:hidden">{route.label}</span>
                </Button>
              </NavigationMenuItem>
            )
          })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
