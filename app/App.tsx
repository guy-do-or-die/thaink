import { Route } from 'wouter';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LandingPage from './pages/LandingPage';
import TanksPage from './pages/TanksPage';

import { useAccount } from './wallet';


const App = () => {
  const { connected } = useAccount();

  return (
    <>
      <Header />
      <Route path="/">
        {connected ? <HomePage /> : <LandingPage />}
      </Route>
      <Route path="/about">
        <AboutPage />
      </Route>
      <Route path="/tanks">
        <TanksPage />
      </Route>
    </>
  )
}

export default App
