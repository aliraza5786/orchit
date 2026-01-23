<template>
    <Header v-if="!isNewHomepage" />
    <router-view />
    <Footer v-if="!isNewHomepage" />

</template>
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';

const route = useRoute();
console.log("route name", route.name);

const isNewHomepage = computed(() => route.name === 'new-homepage');

</script>