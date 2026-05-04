<script setup lang="ts">
import { Roles } from '@/constants.ts'

definePage({
  meta: {
    allowedRoles: [Roles.Admin, Roles.User],
  },
})
</script>

<template>
  <h1>Main page</h1>
</template>

<style scoped></style>
