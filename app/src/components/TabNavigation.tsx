import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  const tabStyle = {
    flex: 1,
    background: '#ecf0f1',
    border: 'none',
    padding: '15px 20px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    borderRight: '1px solid #bdc3c7'
  };

  const activeTabStyle = {
    ...tabStyle,
    background: '#3498db',
    color: 'white'
  };

  const tabsContainerStyle = {
    display: 'flex',
    marginBottom: '30px',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  };

  return (
    <>
      <div style={tabsContainerStyle}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            style={{
              ...(activeTab === tab.id ? activeTabStyle : tabStyle),
              borderRight: index === tabs.length - 1 ? 'none' : '1px solid #bdc3c7'
            }}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={{
            display: activeTab === tab.id ? 'block' : 'none'
          }}
        >
          {tab.content}
        </div>
      ))}
    </>
  );
}