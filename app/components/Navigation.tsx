import { Link, useLocation } from 'wouter'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

export function Navigation() {
  const [location] = useLocation()

  const menuItems = [
    { href: '/make', label: 'Create' },
    { href: '/tanks', label: 'Join' },
  ]

  return (
    <NavigationMenu className="max-w-screen">
      <NavigationMenuList className="space-x-4">
        {menuItems.map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            <Link href={href}>
              <a
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  location === href ? 'text-foreground' : 'text-foreground/60',
                )}
              >
                {label}
              </a>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
