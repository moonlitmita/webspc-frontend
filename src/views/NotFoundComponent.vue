/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div>
    <h1>404</h1>
    <p>页面未找到</p>
  </div>
</template>
<script lang="ts" setup>
import { onMounted } from 'vue';
import {useRouter, useRoute} from 'vue-router'

const route = useRoute()
const router = useRouter()
onMounted(()=> {
  const redirect = route.query.redirect || '/home'
  router.push({name: 'login', query: {redirect}})
})
</script>