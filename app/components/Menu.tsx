import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu"

import { useNavigation } from '@/hooks/useNavigation'

import { cn } from "@/lib/utils"
import { ROUTES } from '@/routes.config'
import styles from '@/components/css/menu.module.css'

export default function Menu() {
    const { navigateTo, location } = useNavigation()

    return <NavigationMenu>
        <NavigationMenuList>
            {Object.values(ROUTES).filter(route => route.menu).map((route) => (
                <NavigationMenuItem key={route.path}>
                    <a onClick={() => navigateTo(route.path)}
                        className={cn(
                            styles.menuItem,
                            location === route.path
                                ? styles.active
                                : styles.inactive
                        )}>
                        {route.label}
                    </a>
                </NavigationMenuItem>
            ))}
        </NavigationMenuList>
    </NavigationMenu>
}