document.querySelectorAll('.template-item').forEach(item => {
    item.addEventListener('click', () => {
      const templatePath = item.dataset.path;
      window.opener.postMessage({ type: 'template-selected', templatePath }, '*');
      window.close();
    });
  });