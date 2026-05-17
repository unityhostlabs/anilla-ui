<template>
    <div ref="containerRef" class="resizable-container">
        <div v-if="isLoading" class="demo-spinner-overlay">
            <div class="demo-spinner"></div>
        </div>

        <iframe ref="iframeRef" :src="src" :style="{
            height: calculatedHeight, /* Dynamically determined by content engine */
            pointerEvents: isDragging ? 'none' : 'auto',
            opacity: isLoading ? 0 : 1
        }" loading="lazy" scrolling="no" @load="onIframeLoad"></iframe>
        <div class="resize-handle" @mousedown="startResize"></div>
    </div>
</template>

<script setup>
import { ref, onUnmounted, nextTick } from 'vue'

const { src } = defineProps({
    src: { type: String, required: true }
    // Removed height prop to let content size dictate the space natively!
})

const isLoading = ref(true)
const calculatedHeight = ref('160px') // Initial fallback placeholder height

const containerRef = ref(null)
const iframeRef = ref(null)
const isDragging = ref(false)

let startX = 0
let startWidth = 0
let resizeObserver = null

// Fired when iframe finishes rendering assets
const onIframeLoad = () => {
    isLoading.value = false

    try {
        const iframeDoc = iframeRef.value.contentDocument || iframeRef.value.contentWindow.document
        if (!iframeDoc) return

        // Create a live sensor matching the content inside your HTML document template
        resizeObserver = new ResizeObserver(() => {
            updateHeight()
        })

        // Observe the body layout inside the iframe window
        resizeObserver.observe(iframeDoc.body)

        // Core initial execution height pass
        updateHeight()
    } catch (e) {
        console.warn("Cross-origin security restrictions blocked automatic scaling. Falling back to default layout constraints.", e)
    }
}

// Function that reads the inner content document boundaries
const updateHeight = () => {
    if (!iframeRef.value) return
    try {
        const iframeDoc = iframeRef.value.contentDocument || iframeRef.value.contentWindow.document
        if (iframeDoc && iframeDoc.documentElement) {
            // 1. Temporarily collapse the iframe height to your minimum baseline.
            // This unblocks the browser layout engine and forces a fast recalculation pass.
            iframeRef.value.style.height = '160px'

            // 2. Query the absolute document element scroll boundary.
            const height = iframeDoc.documentElement.scrollHeight
            
            // 3. Apply the final height instantly, keeping the 160px floor boundary limit intact.
            calculatedHeight.value = `${Math.max(height, 160)}px`
        }
    } catch (e) {
        // Fail-safe protection layer
    }
}

const startResize = (e) => {
    if (!containerRef.value) return
    isDragging.value = true
    startX = e.clientX
    startWidth = containerRef.value.offsetWidth
    document.body.style.cursor = 'ew-resize'
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

    // Force height recalculation immediately as horizontal layout boundaries shift
    nextTick(() => {
        updateHeight()
    })
}

const stopResize = () => {
    isDragging.value = false
    document.body.style.cursor = 'default'
    window.removeEventListener('mousemove', resizeContainer)
    window.removeEventListener('mouseup', stopResize)
}

onUnmounted(() => {
    window.removeEventListener('mousemove', resizeContainer)
    window.removeEventListener('mouseup', stopResize)
    if (resizeObserver) {
        resizeObserver.disconnect()
    }
})
</script>

<style scoped>
/* Keeping your exact CSS visual classes completely identical */
.resizable-container {
    position: relative;
    width: 100%;
    min-width: 320px;
    margin-right: 16px;
    display: block;
}

iframe {
    border-radius: 0.5rem;
    overflow: hidden;
    border: 1px solid var(--vp-c-gutter);
    width: 100%;
    display: block;
    transition: opacity 0.25s ease-in-out;
    vertical-align: top; /* FIX: Deletes typography baseline padding artifacts */
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

.resize-handle:hover::before {
    background-color: var(--vp-c-brand-1, #3eaf7c);
}
</style>