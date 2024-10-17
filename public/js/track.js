    easing: 'easeInOutSine',
    delay: anime.stagger(200),
    autoplay: false,
    // loop: false
  duration: 500,
  complete: function(){
      slideup.play();
    drawer_open = true;
    }
  });


let slidedown = anime({
    targets: '.order-details-container',
    translateY: ['-560','-40px'],
   duartion: 1000,
    autoplay: false,
    begin: function(){
      show_hideCTA("block");
      drawer_open = false;
    }
})

let slideup = anime({
    targets: '.order-details-container',
    translateY: ['-40px','-560px'],
    autoplay: false,
    begin: function(){
     show_hideCTA("none");
    }
})



function show_hideCTA(param){
    document.querySelector(".cta-button").style.display=param;
     document.querySelector(".cta-text").style.display=param;
}
