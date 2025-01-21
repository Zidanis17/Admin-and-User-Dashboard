function addSidebarHoverExpansion() {
    const sidebar = document.querySelector('#sidebar');
    const span = document.querySelector('#base');

    span.style.marginLeft = '100px';
    span.style.marginRight = '100px';

    sidebar.addEventListener('mouseenter', () => {
        span.style.marginLeft = '300px';
        span.style.marginRight = '300px';
    });

    sidebar.addEventListener('mouseleave', () => {
        span.style.marginLeft = '100px';
        span.style.marginRight = '100px';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    addSidebarHoverExpansion();
});