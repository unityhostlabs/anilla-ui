// const resizeObserver = new ResizeObserver(entries => {
//     for (let entry of entries) {
//         // entry.contentRect contains the new dimensions
//         const newHeight = entry.contentRect.height;
//         window.frameElement.style.height = newHeight + 'px';
//         // console.log('New height:', newHeight);
//     }
// });

// resizeObserver.observe(document.documentElement);





// window.addEventListener('DOMContentLoaded', () => {
//     const iframe = window.frameElement;
//     if (!iframe) return;

//     // 1. Forcefully kill any hidden CSS transitions on the iframe container
//     iframe.style.setProperty('transition', 'none', 'important');

//     const resizeObserver = new ResizeObserver(() => {
//         // 2. Safely calculate the document height using offsetHeight
//         // This includes padding/borders and avoids the flexbox shrink-wrap bug
//         const rawHeight = document.documentElement.offsetHeight;
        
//         // 3. Apply your mandatory 150px minimum floor
//         const finalHeight = Math.max(rawHeight, 150);
        
//         // 4. Double frame buffer forces the browser to paint the smaller size instantly
//         window.requestAnimationFrame(() => {
//             window.requestAnimationFrame(() => {
//                 iframe.style.setProperty('height', `${finalHeight}px`, 'important');
//             });
//         });
//     });

//     // Observe documentElement (the <html> tag) for absolute stability
//     resizeObserver.observe(document.documentElement);
// });



window.addEventListener('DOMContentLoaded', () => {
    const iframe = window.frameElement;
    if (!iframe) return;

    const mainDiv = document.querySelector('body > div');
    if (!mainDiv) return;

    const resizeObserver = new ResizeObserver(() => {
        // 1. Temporarily collapse the iframe to your minimum floor.
        // This forces the browser to calculate the SMALLEST possible size of the internal content.
        iframe.style.setProperty('height', '150px', 'important');

        // 2. Immediately force a browser style recalculation (reading offsetHeight does this)
        const trueContentHeight = mainDiv.offsetHeight;

        // 3. Set the final height based on your 150px limit
        const finalHeight = Math.max(trueContentHeight, 150);

        // 4. Snap it to the target size instantly
        iframe.style.setProperty('height', `${finalHeight}px`, 'important');
    });

    resizeObserver.observe(mainDiv);
});
