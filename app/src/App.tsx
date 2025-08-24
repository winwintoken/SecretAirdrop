import { useState } from 'react';
import { Layout } from './components/Layout';
import { TabNavigation } from './components/TabNavigation';
import { SetupTab } from './components/tabs/SetupTab';
import { ClaimTab } from './components/tabs/ClaimTab';
import { StatusTab } from './components/tabs/StatusTab';

function App() {
  const [activeTab, setActiveTab] = useState('setup');

  const tabs = [
    {
      id: 'setup',
      label: 'Project Setup',
      content: <SetupTab />
    },
    {
      id: 'claim',
      label: 'Claim Airdrop',
      content: <ClaimTab />
    },
    {
      id: 'status',
      label: 'View Status',
      content: <StatusTab />
    }
  ];

  return (
    <Layout>
      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </Layout>
  );
}

export default App;
