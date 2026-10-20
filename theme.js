(function(){var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;
window.toggleTheme=function(){t=t==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('theme',t)}})();
