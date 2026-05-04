import 'vue-i18n'
import type { MessagesSchema } from './i18n.generated'

/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  interface DefineLocaleMessage extends MessagesSchema {}
}
