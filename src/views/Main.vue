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
        <!-- 使用CSS类切换而不是transition，避免影响Plotly的handleResize -->
        <div :class="['main-content', { 'ai-hidden': mainStore.aiVisible }]">
          <router-view></router-view>
        </div>
        <!-- AI 对话栏 -->
        <div
          :class="['ai-chat', { 'ai-visible': mainStore.aiVisible }]"
          @transitionend="onTransitionEnd"
          @webkitTransitionEnd="onTransitionEnd">
          <AiChatBox @close="mainStore.toggleAi"/>
        </div>
      </el-main>
    </el-container>
  </div>
</template>
<script lang="ts" setup>
import { useRoute } from 'vue-router';
import CommonAside from '../components/common/CommonAside.vue';
import CommonHeader from '../components/common/CommonHeader.vue';
import AiChatBox from './chatbox/AiChatBox.vue';
import { useMainStore } from '../store'

const mainStore = useMainStore()
const route = useRoute()
const currentRoute = route.meta

// 过渡动画结束后触发resize事件
function onTransitionEnd() {
  // 创建一个自定义事件，通知图表组件执行resize
  window.dispatchEvent(new CustomEvent('aiPanelTransitionEnd'));
}
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
      display: flex; /* 使用flex布局来处理内容区域和AI助手面板 */
      overflow: hidden; /* 防止内容溢出 */
      .main-content {
        flex: 1;
        min-height: 0; /* 允许flex子元素收缩，解决高度计算问题 */
        overflow-y: hidden; /* 防止出现滚动条，让内容内部处理滚动 */
        transition: flex 0.3s ease; /* 当AI助手面板出现/消失时，通过flex调整内容区域大小 */
      }
      .main-content.ai-hidden {
        flex: calc(100% - 360px); /* AI助手显示时，调整flex大小以腾出空间 */
      }
      .ai-chat {
        width: 0;          /* 默认隐藏，宽度为0 */
        height: 100%;
        border-left: 1px solid #e4e7ed;
        overflow: hidden;
        background-color: #fff;
        flex-shrink: 0;    /* 防止被压缩 */
        transition: width 0.3s ease;  /* 添加宽度变化的过渡效果 */
      }
      .ai-chat.ai-visible {
        width: 360px;      /* 显示时设置为360px */
      }
    }
  }
  .common-aside {
    box-sizing: border-box;
    background: #545c64;
  }
}
</style>
