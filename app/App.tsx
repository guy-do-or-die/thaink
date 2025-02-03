import { Route, Router, useLocation } from 'wouter'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

import LandingPage from '@/pages/LandingPage'
import MakePage from '@/pages/MakePage'
import TanksPage from '@/pages/TanksPage'
import ThinkPage from '@/pages/ThinkPage'

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
          <Route path={ROUTES.THINK.path}>
            <ThinkPage />
          </Route>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
