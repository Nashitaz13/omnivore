import '../styles/globals.css'
import '../styles/articleInnerStyling.css'

import type { AppProps } from 'next/app'
import { IdProvider } from '@radix-ui/react-id'
import { NextRouter, useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import TopBarProgress from 'react-topbar-progress-indicator'
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  Priority,
} from 'kbar'
import {
  animatorStyle,
  KBarResultsComponents,
  searchStyle,
} from '../components/elements/KBar'
import { updateTheme } from '../lib/themeUpdater'
import { ThemeId } from '../components/tokens/stitches.config'
import { posthog } from 'posthog-js'
import { GoogleReCaptchaProvider } from '@google-recaptcha/react'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import React from 'react'

const queryClient = new QueryClient()

if (typeof window !== 'undefined') {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
  })

  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    // one week cache time
    maxAge: 7 * 24 * 60 * 60 * 1000,
    dehydrateOptions: {
      shouldDehydrateQuery: ({ queryKey }) => {
        // Don't cache the library items in local storage
        const [firstKey] = queryKey
        return firstKey !== 'library-items'
      },
    },
  })
}

TopBarProgress.config({
  barColors: {
    '0': '#FFD234',
    '1.0': '#FFD234',
  },
  shadowBlur: 0,
  barThickness: 2,
})

const generateActions = (router: NextRouter) => {
  return [
    {
      id: 'lightTheme',
      section: 'Preferences',
      name: 'Change theme (light) ',
      shortcut: ['v', 'l'],
      keywords: 'light theme',
      priority: Priority.LOW,
      perform: () => updateTheme(ThemeId.Light),
    },
    {
      id: 'darkTheme',
      section: 'Preferences',
      name: 'Change theme (dark) ',
      shortcut: ['v', 'd'],
      keywords: 'dark theme',
      priority: Priority.LOW,
      perform: () => updateTheme(ThemeId.Dark),
    },
  ]
}

const ConditionalCaptchaProvider = (props: {
  children: ReactNode
}): JSX.Element => {
  if (process.env.NEXT_PUBLIC_RECAPTCHA_CHALLENGE_SITE_KEY) {
    return (
      <GoogleReCaptchaProvider
        type="v2-checkbox"
        isEnterprise={true}
        host="recaptcha.net"
        siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_CHALLENGE_SITE_KEY ?? ''}
      >
        {props.children}
      </GoogleReCaptchaProvider>
    )
  }
  return <>{props.children}</>
}

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       gcTime: 1000 * 60 * 60 * 24,
//     },
//   },
// })

export function OmnivoreApp({ Component, pageProps }: AppProps): JSX.Element {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      posthog.capture('$pageview')
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <ConditionalCaptchaProvider>
      <QueryClientProvider client={queryClient}>
        <KBarProvider actions={generateActions(router)}>
          <KBarPortal>
            <KBarPositioner style={{ zIndex: 100 }}>
              <KBarAnimator style={animatorStyle}>
                <KBarSearch style={searchStyle} />
                <KBarResultsComponents />
              </KBarAnimator>
            </KBarPositioner>
          </KBarPortal>
          <IdProvider>
            <Component {...pageProps} />
          </IdProvider>
        </KBarProvider>
      </QueryClientProvider>
    </ConditionalCaptchaProvider>
  )
}

export default OmnivoreApp
