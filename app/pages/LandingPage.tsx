import Content from '../components/Content';
import Connection from '../components/Connection';

export default function LandingPage() {
  return (
    <Content>
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold">Welcome to Thaink Tank</h1>
        <p className="text-xl">Connect your wallet to continue</p>
        <Connection />
      </div>
    </Content>
  );
}
