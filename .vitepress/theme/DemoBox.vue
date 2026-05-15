<template>
    <div class="resizable-container">
        <iframe :src="src" loading="lazy" scrolling="no"></iframe>
        <div class="resize-handle"></div>
    </div>
</template>

<script setup>
    defineProps({
        src: String
    })
</script>