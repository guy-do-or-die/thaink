import Logo from '@/components/Logo'
import Connection from '@/components/Connection'
import Menu from '@/components/Menu'
import Notification from '@/components/Notification'

import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'

export default function Header() {
  const { navigateTo } = useNavigation()

  return (
    <header className="fixed top-0 w-full border-b bg-white/80 backdrop-blur-sm z-50">
      <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center">
        <div onClick={() => navigateTo(ROUTES.LANDING.path)} className="flex-shrink-0 cursor-pointer">
          <Logo />
        </div>
        <div className="hidden md:flex flex-1 justify-center">
          <Menu />
        </div>
        <div className="flex flex-1 md:flex-initial items-center justify-end">
          <div className="flex items-center gap-2 sm:gap-4 mr-2 sm:mr-4">
            <div className="md:hidden">
              <Menu />
            </div>
            <Notification />
          </div>
          <Connection />
        </div>
      </div>
    </header>
  )
}
