import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { TABS, type TabType } from '../constants/tabs'

type TabContextType = {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function TabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>(TABS.WORKOUT)

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  )
}

export function useTab() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider')
  }
  return context
}
