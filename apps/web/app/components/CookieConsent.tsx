'use client'

import { useEffect } from 'react'
import * as CookieConsent from 'vanilla-cookieconsent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Shield, Cookie, BarChart3, Target } from 'lucide-react'

export default function CookieConsentComponent() {
  useEffect(() => {
    // Import the CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.1.0/dist/cookieconsent.css'
    document.head.appendChild(link)

    // Configure and run CookieConsent
    CookieConsent.run({
      // Root element where the modal will be appended
      root: 'body',
      
      // Auto show the consent modal
      autoShow: true,
      
      // Disable page interaction while modal is visible
      disablePageInteraction: true,
      
      // Hide from bots
      hideFromBots: true,
      
      // Mode: 'opt-in' means cookies are blocked until user consents
      mode: 'opt-in',
      
      // Revision number for consent updates
      revision: 0,
      
      // Cookie configuration
      cookie: {
        name: 'cc_cookie',
        domain: location.hostname,
        path: '/',
        sameSite: 'Lax',
        expiresAfterDays: 182,
      },
      
      // GUI options
      guiOptions: {
        consentModal: {
          layout: 'box',
          position: 'bottom center',
          equalWeightButtons: true,
          flipButtons: false
        },
        preferencesModal: {
          layout: 'box',
          equalWeightButtons: true,
          flipButtons: false
        }
      },
      
      // Categories of cookies
      categories: {
        necessary: {
          enabled: true,
          readOnly: true
        },
        analytics: {
          autoClear: {
            cookies: [
              {
                name: /^_ga/,   // regex: match all cookies starting with '_ga'
              },
              {
                name: '_gid',   // string: exact cookie name
              }
            ]
          },
          services: {
            ga: {
              label: 'Google Analytics',
              onAccept: () => {
                // Load Google Analytics
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                  });
                }
              },
              onReject: () => {
                // Disable Google Analytics
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('consent', 'update', {
                    'analytics_storage': 'denied'
                  });
                }
              }
            }
          }
        },
        advertising: {
          autoClear: {
            cookies: [
              {
                name: /^_fbp/,   // Facebook Pixel
              },
              {
                name: '_fbc',    // Facebook Click ID
              }
            ]
          },
          services: {
            facebook: {
              label: 'Facebook Pixel',
              onAccept: () => {
                // Load Facebook Pixel
                if (typeof window !== 'undefined' && (window as any).fbq) {
                  (window as any).fbq('consent', 'grant');
                }
              },
              onReject: () => {
                // Disable Facebook Pixel
                if (typeof window !== 'undefined' && (window as any).fbq) {
                  (window as any).fbq('consent', 'revoke');
                }
              }
            }
          }
        }
      },
      
      // Language configuration
      language: {
        default: 'en',
        translations: {
          en: {
            consentModal: {
              title: 'We use cookies',
              description: 'We use cookies to enhance your experience, analyze our traffic, and personalize content. By accepting our cookies, you agree to our use of cookies in accordance with our Privacy Policy.',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              showPreferencesBtn: 'Manage preferences',
              footer: `
                <a href="/privacy" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">Privacy Policy</a>
                <a href="/terms" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline ml-4">Terms of Service</a>
              `
            },
            preferencesModal: {
              title: 'Cookie Preferences',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Reject all',
              savePreferencesBtn: 'Save preferences',
              closeIconLabel: 'Close',
              serviceCounterLabel: 'Service|Services',
              sections: [
                {
                  title: 'Strictly Necessary Cookies',
                  description: 'These cookies are essential for the proper functioning of our website and cannot be disabled. They enable basic functions like page navigation and access to secure areas of the website.',
                  linkedCategory: 'necessary'
                },
                {
                  title: 'Analytics Cookies',
                  description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us understand which pages are the most and least popular and see how visitors move around the site.',
                  linkedCategory: 'analytics',
                  cookieTable: {
                    caption: 'Cookie table',
                    headers: {
                      name: 'Cookie',
                      domain: 'Domain',
                      desc: 'Description'
                    },
                    body: [
                      {
                        name: '_ga',
                        domain: location.hostname,
                        desc: 'Google Analytics - Measures site usage and performance'
                      },
                      {
                        name: '_gid',
                        domain: location.hostname,
                        desc: 'Google Analytics - Distinguishes unique users'
                      }
                    ]
                  }
                },
                {
                  title: 'Advertising Cookies',
                  description: 'These cookies are used to deliver advertisements that are relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.',
                  linkedCategory: 'advertising',
                  cookieTable: {
                    caption: 'Cookie table',
                    headers: {
                      name: 'Cookie',
                      domain: 'Domain',
                      desc: 'Description'
                    },
                    body: [
                      {
                        name: '_fbp',
                        domain: '.facebook.com',
                        desc: 'Facebook Pixel - Tracks conversions and optimizes ads'
                      },
                      {
                        name: '_fbc',
                        domain: '.facebook.com',
                        desc: 'Facebook Click ID - Tracks ad clicks and conversions'
                      }
                    ]
                  }
                },
                {
                  title: 'More Information',
                  description: 'For any queries in relation to our policy on cookies and your choices, please contact us at privacy@preset.ie.'
                }
              ]
            }
          }
        }
      },
      
      // Callbacks
      onFirstConsent: ({cookie}) => {
        console.log('User gave consent for the first time', cookie)
      },
      
      onConsent: ({cookie}) => {
        console.log('User gave consent', cookie)
      },
      
      onChange: ({changedCategories, changedServices}) => {
        console.log('User changed preferences', changedCategories, changedServices)
      },
      
      onModalReady: ({modalName}) => {
        console.log('Modal ready:', modalName)
      },
      
      onModalShow: ({modalName}) => {
        console.log('Modal visible:', modalName)
      },
      
      onModalHide: ({modalName}) => {
        console.log('Modal hidden:', modalName)
      }
    })

    // Cleanup function
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [])

  return null // This component doesn't render anything, it just initializes CookieConsent
}
