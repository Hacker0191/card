document.getElementById('editBtn').addEventListener('click', () => {
    window.history.back();
  });
  

  
  document.getElementById('shareBtn').addEventListener('click', () => {
    const previewUrl = window.location.href;
    const instagramUrl = `https://www.instagram.com/stories/create/?url=${encodeURIComponent(previewUrl)}`;
    window.open(instagramUrl, '_blank');
  });