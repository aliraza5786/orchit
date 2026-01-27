<script setup lang="ts">
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css'
</script>
<template>
  <div class="min-h-[100dvh] relative  text-text-primary  transition-colors bg-bg-body">
    <router-view />
  </div>
  <Toaster position="bottom-right" />
</template>
<style>
  body{
    font-family: 'Lato', sans-serif;
  }
</style>