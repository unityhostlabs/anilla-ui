// .vitepress/theme/iframe-resizer.js

export function initIframeResizer() {
  if (typeof window === 'undefined') return;

  const observer = new MutationObserver(() => {
    // Target by class instead of unique IDs
    const boxes = document.querySelectorAll('.resizable-container');
    
    boxes.forEach(box => {
      const bar = box.querySelector('.resize-handle');
      if (!box || !bar || bar.dataset.initialized === 'true') return;

      bar.dataset.initialized = 'true';

      let startX = 0;
      let startWidth = 0;
      const iframe = box.querySelector('iframe');

      const startResize = (e) => {
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(box).width, 10);
        
        iframe.style.pointerEvents = 'none';
        document.body.style.cursor = 'ew-resize';

        window.addEventListener('mousemove', resizeContainer);
        window.addEventListener('mouseup', stopResize);
      };

      const resizeContainer = (e) => {
        const currentWidth = startWidth + (e.clientX - startX);
        
        // FIX: Find the nearest stable layout container instead of the direct tab parent
        const docContainer = box.closest('.vp-doc') || box.parentElement;
        const parentMaxWidth = docContainer.getBoundingClientRect().width;

        if (currentWidth >= 320 && currentWidth <= parentMaxWidth) {
          box.style.width = `${currentWidth}px`;
        } else if (currentWidth > parentMaxWidth) {
          box.style.width = '100%';
        }
      };

      const stopResize = () => {
        iframe.style.pointerEvents = 'auto';
        document.body.style.cursor = 'default';
        
        window.removeEventListener('mousemove', resizeContainer);
        window.removeEventListener('mouseup', stopResize);
      };

      bar.addEventListener('mousedown', startResize);
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
