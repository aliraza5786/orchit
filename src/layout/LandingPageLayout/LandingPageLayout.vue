<template>
  <div>
    <Header :isDark="isDark" :toggleTheme="toggleTheme"  />
    <router-view />
    <FinalCTA :isDark="isDark" :toggleTheme="toggleTheme"/>
  </div>
</template>
<script setup lang="ts">
import Header from '../../components/HomeNew/Header.vue';
import FinalCTA from '../../components/HomeNew/FinalCTA.vue';
import { useTheme } from '../../composables/useTheme';
const { isDark, toggleTheme } = useTheme()
</script>