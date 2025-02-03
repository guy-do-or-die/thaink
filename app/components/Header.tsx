import Logo from '@/components/Logo';
import Connection from '@/components/Connection';

import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu"

import { Notification } from '@/components/Notification';

export default function Header() {

  return (
    <header className="fixed top-0 w-full border-b bg-white/80 backdrop-blur-sm z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Logo />
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <a href="/" className="w-full h-full flex items-center justify-center">
                Home
              </a>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <a href="/tanks" className="w-full h-full flex items-center justify-center">
                Tanks
              </a>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <a href="/about" className="w-full h-full flex items-center justify-center">
                About
              </a>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Notification />
        <Connection />
      </div>
    </header>
  );
}
