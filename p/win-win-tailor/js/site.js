var bar = document.getElementById('bar');
function s() { bar.classList.toggle('scrolled', window.scrollY > 8); }
window.addEventListener('scroll', s, { passive: true });
s();
