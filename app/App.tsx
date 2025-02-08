import { Route, Router, useLocation } from 'wouter'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

import LandingPage from '@/pages/LandingPage'
import MakePage from '@/pages/MakePage'
import TanksPage from '@/pages/TanksPage'
import TankPage from '@/pages/TankPage'
import SharePage from '@/pages/SharePage'
import NotFound from '@/pages/NotFound'

import { useAccount } from '@/wallet'
import { useWatchBlock } from '@/stores/useBlockStore'

import { ROUTES } from '@/routes.config'

export function App() {
  const { connected } = useAccount()
  const [location] = useLocation()

  useWatchBlock()

  const isLanding = location === ROUTES.LANDING.path || location === '/'

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {!isLanding && <Header />}
        <main className="flex-grow">
          <Route path={ROUTES.LANDING.path}>
            <LandingPage />
          </Route>
          <Route path={ROUTES.MAKE.path}>
            <MakePage />
          </Route>
          <Route path={ROUTES.TANKS.path}>
            <TanksPage />
          </Route>
          <Route path={ROUTES.MINTED.path}>
            <TanksPage filter="minted" />
          </Route>
          <Route path={ROUTES.TANK.path}>
            <TankPage />
          </Route>
          <Route path={ROUTES.SHARE.path}>
            <SharePage />
          </Route>
          <Route path={ROUTES.NOT_FOUND.path}>
            <NotFound />
          </Route>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
