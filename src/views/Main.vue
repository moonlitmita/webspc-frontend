/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="common-layout">
    <div class="common-aside">
      <CommonAside />
    </div>
    <el-container class="r-container">
      <CommonHeader class="common-header"></CommonHeader>
      <el-main class="right-main">
        <router-view></router-view>
        <!-- AI 对话栏 -->
        <transition name="slide">
          <div v-if="mainStore.aiVisible" class="ai-chat">
            <AiChatBox @close="mainStore.toggleAi"/>
          </div>
        </transition>
      </el-main>
    </el-container>
  </div>
</template>
<script lang="ts" setup>
import { useRoute } from 'vue-router';
import CommonAside from '../components/common/CommonAside.vue';
import CommonHeader from '../components/common/CommonHeader.vue';
import AiChatBox from './chatbox/AiChatBox.vue';
import { ref, provide } from 'vue';
import { useMainStore } from '../store'

const mainStore = useMainStore()
const route = useRoute()
const currentRoute = route.meta
// const aiVisible = ref(false)
// provide('toggleAi', () => (aiVisible.value = !aiVisible.value))
</script>
<style lang='less' scoped>
.common-layout {
  width: 100%;
  height: 100vh;
  border: 1px solid #ccc;
  display: flex;
  flex-wrap: nowrap;
  box-sizing: border-box;
  .r-container {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-wrap: nowrap;
    flex-direction: column;
    .common-header {
      box-sizing: border-box;
      flex: 0 1 auto;
      width: 100%;
    }
    .common-tag {
      box-sizing: border-box;
      flex: 0 1 auto;
    }
    .right-main {
      box-sizing: border-box;
      padding: 0;
      flex: 1;
      display: flex;
      align-items: stretch;
      .ai-chat {
        flex: 0 0 360px;      /* 固定宽度 */
        height: 100%;
        border-left: 1px solid #e4e7ed;
        overflow: hidden;
        background-color: #288358ff;
      }
    }
  }
  .common-aside {
    box-sizing: border-box;
    background: #545c64;
  }
}
</style>
