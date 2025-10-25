<script setup lang="ts">
import { computed } from 'vue'
import { useKnowledgeBySlug } from '../../../queries/useKnowledge'

const props = defineProps<{
  slug: string
}>()

console.log(props.slug)

const slugRef = computed(() => props.slug)

const { data: articleData, isLoading, isError } = useKnowledgeBySlug(slugRef)
</script>

<template>
  <div class="space-y-4">
    <!-- Loading -->
    <div v-if="isLoading" class="text-text-secondary">Loading article...</div>

    <!-- Error -->
    <div v-else-if="isError" class="text-red-500">Failed to load article.</div>

    <!-- Article Content -->
    <div class="artile_content" v-else v-html="articleData?.content"></div>
  </div>
</template>

<style>
.artile_content h2 {
  font-size: 34px;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px;
  font-family: manrope;
  letter-spacing: -1px;
}
.artile_content h2 *{
  font-size: 34px; 
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px;
  font-family: manrope;
  letter-spacing: -1px;
}

.artile_content h3 {
  font-size: 32px;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px;
}
.artile_content h3 * {
  font-size: 32px; 
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px;
}

.artile_content h4 {
  font-size: 20px;
  margin: 10px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 28px;
}
.artile_content h4 * {
  font-size: 20px; 
  font-weight: 700;
  color: var(--text-primary);
  line-height: 28px;
}

.artile_content p {
  font-size: 16px;
  line-height: 24px;
  margin-bottom: 10px;
  font-weight: 400;
  font-family: manrope;
  color: var(--color-text-secondary);
}

.artile_content p strong {
  font-size: 16px;
  line-height: 24px;
  margin-bottom: 10px;
  color: var(--color-text-primary);
}

.artile_content ul {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 15px;
  margin: 15px 0px;
  list-style: disc;
}

.artile_content ul li {
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;
  font-family: manrope;
  color: var(--color-text-secondary); 
}
.artile_content ul li span{
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  font-family: manrope;
  color: var(--color-text-primary);
}


.artile_content a {
  color: var(--accent) !important;
  font-weight: 500;
  text-decoration: underline;
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}

@media(max-width:1024px) {
  .artile_content h2 {
    font-size: 24px;
    line-height: 32px;
  }

  .artile_content h3 {
    font-size: 22px;
    line-height: 28px;
    margin: 10px 0px;
  }

  .artile_content h4 {
    font-size: 18px;
    line-height: 26px;
  }
}

@media(max-width:768px) {
  .artile_content p {
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 10px;
    color: var(--color-text-secondary);
  }

}
</style>
