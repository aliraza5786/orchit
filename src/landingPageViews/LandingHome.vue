<script setup lang="ts">
import AchieveMoreSec from './components/AchieveMoreSec.vue';
import DiscoverMore from './components/DiscoverMore.vue';
import Faqs from './components/Faqs.vue';
import FeaturesSec from './components/FeaturesSec.vue';
import GetStartedStepsSec from './components/GetStartedStepsSec.vue';
import HeroBanner from './components/HeroBanner.vue';
import SmarterProjectSec from './components/SmarterProjectSec.vue'; 
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
const router = useRouter()
const authStore = useAuthStore()
 const isLoggedIn=() =>{
  if(authStore.isAuthenticated){
    router.push('/dashboard')
  }
 }
onMounted(isLoggedIn);
</script>

<template>
    <HeroBanner />
    <SmarterProjectSec /> 
    <GetStartedStepsSec />
    <FeaturesSec />
    <AchieveMoreSec />
    <Faqs />
    <DiscoverMore />
</template>