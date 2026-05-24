<template>
    <div ref="containerRef" class="resizable-container">
        <div v-if="showTheme" class="demo-toolbar">
            <button 
                :id="id"
                :class="['theme-btn', { active: isDarkMode }]"
                @click="toggleTheme">
                {{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}
            </button>
        </div>

        <div v-if="isLoading" class="demo-spinner-overlay">
            <div class="demo-spinner"></div>
        </div>

        <iframe ref="iframeRef" :src="src" :style="{
            height: calculatedHeight,
            pointerEvents: isDragging ? 'none' : 'auto',
            opacity: isLoading ? 0 : 1
        }" loading="lazy" @load="onIframeLoad"></iframe>
        <div class="resize-handle" @mousedown="startResize"></div>
    </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const props = defineProps({
    src: { type: String, required: true },
    height: { type: String, default: '160px' },
    showTheme: { type: Boolean, default: true },
    id: { type: String, default: '' }
})

const isLoading = ref(true)
const calculatedHeight = ref(props.height)
const isDarkMode = ref(sessionStorage.getItem(props.id) === 'dark') || ref(false) // Tracks true/false toggle state

const containerRef = ref(null)
const iframeRef = ref(null)
const isDragging = ref(false)

let startX = 0
let startWidth = 0

const onIframeLoad = () => {
    isLoading.value = false
    sendTheme()
}

// Switches the boolean state and updates the iframe
const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    sendTheme()
}

// Sends 'dark' or 'light' string based on the boolean state
const sendTheme = () => {
    const currentMode = isDarkMode.value ? 'dark' : 'light'
    iframeRef.value?.contentWindow?.postMessage({ uiTheme: currentMode, id: props.id }, '*')
}

const startResize = (e) => {
    if (!containerRef.value) return
    isDragging.value = true
    startX = e.clientX
    startWidth = containerRef.value.offsetWidth
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', resizeContainer)
    window.addEventListener('mouseup', stopResize)
}

const resizeContainer = (e) => {
    if (!containerRef.value) return
    const currentWidth = startWidth + (e.clientX - startX)
    const docContainer = containerRef.value.closest('.vp-doc') || containerRef.value.parentElement
    const parentMaxWidth = docContainer ? docContainer.getBoundingClientRect().width - 16 : window.innerWidth

    if (currentWidth >= 320 && currentWidth <= parentMaxWidth) {
        containerRef.value.style.width = `${currentWidth}px`
    } else if (currentWidth > parentMaxWidth) {
        containerRef.value.style.width = '100%'
    }
}

const stopResize = () => {
    isDragging.value = false
    document.body.style.cursor = 'default'
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', resizeContainer)
    window.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
    window.removeEventListener('mousemove', resizeContainer)
    window.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.resizable-container {
    position: relative;
    width: 100%;
    min-width: 320px;
    margin-right: 16px;
    display: block;
}

.demo-toolbar {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    justify-content: end;
}

.theme-btn {
    padding: 2px 10px;
    border-radius: 4px;
    border: 1px solid var(--vp-c-gutter);
    background: transparent;
    color: var(--vp-c-text-2);
    cursor: pointer;
    font-size: 0.75rem;
}

.theme-btn.active {
    background: var(--vp-c-brand-1, #3eaf7c);
    border-color: var(--vp-c-brand-1, #3eaf7c);
    color: #fff;
}

iframe {
    border-radius: 0.5rem;
    overflow: auto;
    border: 1px solid var(--vp-c-gutter);
    width: 100%;
    display: block;
    transition: opacity 0.25s ease-in-out;
    vertical-align: top;
}

.demo-spinner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    background-color: var(--vp-c-bg-soft);
    border-radius: 0.5rem;
    border: 1px solid var(--vp-c-gutter);
}

.demo-spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid var(--vp-c-gutter);
    border-top-color: var(--vp-c-brand-1, #3eaf7c);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.resize-handle {
    position: absolute;
    top: 0;
    right: -12px;
    width: 12px;
    height: 100%;
    cursor: ew-resize;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.resize-handle::before {
    content: " ";
    width: 6px;
    height: 32px;
    border-radius: 50px;
    background-color: #99a1af;
    transition: background-color 0.2s ease;
}

.resize-handle:hover::before,
.resize-handle:active::before {
    background-color: var(--vp-c-brand-1, #3eaf7c);
}
</style>