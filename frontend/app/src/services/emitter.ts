import mitt from 'mitt'

export type ApplicationEvents = {
  logoutRequired: { reason?: string }
  languageUpdated: { language?: string | null }
}

const emitter = mitt<ApplicationEvents>()

emitter.on('languageUpdated', ({ language }): void => {
  if (language == null) {
    return
  }

  document.documentElement.lang = language
})

export default emitter
