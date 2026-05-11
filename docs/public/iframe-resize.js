const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        // entry.contentRect contains the new dimensions
        const newHeight = entry.contentRect.height;
        window.frameElement.style.height = newHeight + 'px';
        // console.log('New height:', newHeight);
    }
});

resizeObserver.observe(document.documentElement);

// window.addEventListener('DOMContentLoaded', () => {
//     const resizeObserver = new ResizeObserver(entries => {
//         const newHeight = document.documentElement.scrollHeight;
//         if (newHeight > 0 && window.frameElement) {
//             window.frameElement.style.height = newHeight + 'px';
//         }
//     });

//     // Body is guaranteed to exist now
//     resizeObserver.observe(document.body);
// });