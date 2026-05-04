<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import jwtService from '@/services/jwtService.ts'
import { jwtDecode } from 'jwt-decode'
import { type RouteLocationRaw } from 'vue-router'
import { Roles } from './constants'
import type { JwtPayload } from '@/types/auth'
import Menu from 'primevue/menu'
import authHttpService from '@/services/http/authHttpService.ts'


const router = useRouter()
const isAuthorized = ref(false)
const currentUserRole = ref<Roles | null>(null)
const isMenuVisible = ref(true)
const menuItems = ref<
  {
    label?: string
    showDivider?: boolean
    route?: RouteLocationRaw
    items?: { label: string; route: RouteLocationRaw }[]
  }[]
>([])

const loadMenuItems = async () => {
  try {
    if (currentUserRole.value === Roles.Admin) {
      menuItems.value = [
        {
          label: 'template',
          route: '/u/templates',
        },
      ]
    } else {
      menuItems.value = [
        {
          label: 'template',
          route: '/u/templates',
        },
      ]
    }
  } catch (error) {
    console.error('Ошибка при загрузке пунктов меню:', error)
  }
}

const showMenu = computed(() => router.currentRoute.value.path !== '/login' && isAuthorized.value)
const isActiveRoute = (route: RouteLocationRaw) => route === router.currentRoute.value.path

watch(
  () => isAuthorized.value,
  async (isAuth) => {
    if (isAuth) {
      await loadMenuItems()
    }
  },
  { immediate: true },
)

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value
}

router.beforeEach((to, from, next) => {
  if (to.path === '/u/auth/login') {
    next()
    return
  }

  const token = jwtService.getToken()
  if (!token) {
    router.push('/u/auth/login')
    return
  }

  isAuthorized.value = true

  const currentRole = jwtDecode<JwtPayload>(token).role as Roles
  const allowedRoles = to.meta.allowedRoles as Roles[]

  if (allowedRoles.includes(currentRole)) {
    currentUserRole.value = currentRole
    next()
    return
  } else {
    logout()
    isAuthorized.value = false
    return
  }
})

const clearStorage = async () => {
  localStorage.clear()
  location.reload()
}

const logout = () => {
  authHttpService.logout()
  jwtService.clear()
  clearStorage()
  router.push('/u/auth/login')
}
</script>

<template>
  <div class="flex flex-col h-screen">
    <Menubar class="h-[60px] flex items-center bg-[#7c98ff] border-none rounded-none">
      <template #start>
        <div class="flex items-center">
          <Button
            v-if="showMenu"
            icon="pi pi-bars"
            class="p-button-text p-button-plain"
            @click="toggleMenu"
          />
          <RouterLink class="ml-2 text-lg font-bold text-white" :to="{ name: '/' }">
            Admin
          </RouterLink>
        </div>
      </template>
      <template #end v-if="isAuthorized">
        <Button
          id="logout-button"
          class="p-0 w-10 h-10 rounded-full border-stone-50 text-stone-50 hover:border-stone-100 hover:bg-stone-100 hover:text-stone-900 active:border-stone-200 active:bg-stone-200 active:text-stone-800"
          variant="text"
          icon="pi pi-sign-out"
          :aria-label="'Logout'"
          @click="logout"
        />
      </template>
    </Menubar>
    <div class="flex flex-row flex-1 overflow-hidden">
      <Transition name="slide">
        <div
          v-if="showMenu && isMenuVisible"
          class="w-64 h-full bg-white shadow-md fixed"
          style="top: 60px; z-index: 10; border: none"
        >
          <Menu :model="menuItems" class="w-full h-full bg-white" style="border: none">
            <template #item="{ item }">
              <Divider v-if="item.showDivider" />
              <router-link
                v-else-if="item.route"
                v-slot="{ href, navigate }"
                :to="item.route"
                custom
              >
                <a
                  v-ripple
                  :href="href"
                  @click="navigate"
                  :class="[
                    'flex items-center p-2 text-gray-700 hover:bg-gray-100',
                    { 'bg-gray-200': isActiveRoute(item.route) },
                  ]"
                >
                  <span v-if="item.icon" :class="item.icon" />
                  <span class="ml-2">{{ item.label }}</span>
                </a>
              </router-link>
            </template>
          </Menu>
        </div>
      </Transition>
      <div
        :class="
          showMenu && isMenuVisible ? 'flex-1 p-4 overflow-auto ml-64' : 'flex-1 p-4 overflow-auto'
        "
        class="transition-all duration-300"
      >
        <RouterView :key="router.currentRoute.value.fullPath" v-slot="{ Component }">
          <template v-if="Component">
            <Suspense timeout="0">
              <component :is="Component"></component>
              <template #fallback>
                <div class="max-w-xl mx-auto flex items-center justify-center">
                  <ProgressSpinner />
                </div>
              </template>
            </Suspense>
          </template>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .w-64 {
    width: 80%;
    max-width: 300px;
  }

  .ml-64 {
    margin-left: 0 !important;
  }
}
</style>
