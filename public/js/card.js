const cardId = '<%= cardData.id %>';
  
  // Fetch and display reactions
  async function fetchReactions() {
    try {
      const response = await fetch(`/card/${cardId}/reactions`);
      const reactions = await response.json();
      const container = document.getElementById('reactionsContainer');
      container.innerHTML = '';
      
      Object.entries(reactions).forEach(([emoji, users]) => {
        const div = document.createElement('div');
        div.className = 'reaction-item';
        div.innerHTML = `${emoji} ${users.length}`;
        container.appendChild(div);
      });
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }
  
  // Add reaction
  async function addReaction(emoji) {
    const userName = prompt('Enter your name:');
    if (!userName) return;
  
    try {
      await fetch(`/card/${cardId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userName })
      });
      
      fetchReactions();
      toggleEmojiPicker();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  }
  
  // Toggle emoji picker
  function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
  }
  
  // Fetch and display replies
  async function fetchReplies() {
    try {
      const response = await fetch(`/card/${cardId}/replies`);
      const replies = await response.json();
      const container = document.getElementById('repliesContainer');
      container.innerHTML = '';
      
      replies.forEach(reply => {
        const div = document.createElement('div');
        div.className = 'reply-item';
        div.innerHTML = `
          <strong>${reply.userName}</strong>
          <p>${reply.message}</p>
          <small>${new Date(reply.timestamp?.seconds * 1000).toLocaleString()}</small>
        `;
        container.appendChild(div);
      });
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  }
  
  // Submit reply
  async function submitReply() {
    const userName = document.getElementById('replyUserName').value;
    const message = document.getElementById('replyMessage').value;
    
    if (!userName || !message) {
      alert('Please enter both your name and message');
      return;
    }
  
    try {
      await fetch(`/card/${cardId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, message })
      });
      
      document.getElementById('replyUserName').value = '';
      document.getElementById('replyMessage').value = '';
      fetchReplies();
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  }
  
  // Initial load
  fetchReactions();
  fetchReplies();
  
  // Refresh data periodically
  setInterval(fetchReactions, 10000);
  setInterval(fetchReplies, 10000);

  function toggleFullscreen(element) {
      if (!document.fullscreenElement) {
          // Enter fullscreen
          if (element.requestFullscreen) {
              element.requestFullscreen();
          } else if (element.webkitRequestFullscreen) { /* Safari */
              element.webkitRequestFullscreen();
          } else if (element.msRequestFullscreen) { /* IE11 */
              element.msRequestFullscreen();
          }
      } else {
          // Exit fullscreen
          if (document.exitFullscreen) {
              document.exitFullscreen();
          } else if (document.webkitExitFullscreen) { /* Safari */
              document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { /* IE11 */
              document.msExitFullscreen();
          }
      }
  }
  
  // Optional: Handle fullscreen change
  document.addEventListener('fullscreenchange', function() {
      const element = document.querySelector('.card-page');
      if (document.fullscreenElement) {
          element.style.backgroundColor = 'white';
          element.style.overflow = 'auto';
          element.style.padding = '20px';
          element.style.height = '100%';
      } else {
          element.style.backgroundColor = '';
          element.style.overflow = '';
          element.style.padding = '';
          element.style.height = '';
      }
  });