import { render, type RenderOptions } from '@testing-library/react'
import { LanguageProvider } from '../contexts/LanguageContext'
import type { ReactElement, ReactNode } from 'react'

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  )
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'
export { customRender as render }
