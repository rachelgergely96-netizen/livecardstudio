export const demoCardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LiveCardStudio Demo</title>
  <style>
    html,body{margin:0;padding:0;min-height:100%;font-family:Georgia,serif;color:#3a2f2a;background:linear-gradient(150deg,#fdf8f0,#f5ebdf,#f0e2d5)}
    main{max-width:860px;margin:0 auto;padding:30px 20px 60px}
    .banner{position:sticky;top:10px;z-index:3;display:flex;justify-content:space-between;gap:12px;border:1px solid rgba(200,160,120,.25);border-radius:999px;padding:10px 14px;background:rgba(255,250,242,.9);backdrop-filter:blur(8px)}
    h1{font-size:clamp(40px,7vw,72px);font-style:italic;color:#c87941;line-height:.98;margin:18px 0 8px;text-align:center}
    .sub{text-align:center;font-size:clamp(22px,3vw,30px)}
    .grid{margin-top:20px;display:grid;gap:16px}
    .photo{border:1px solid rgba(200,160,120,.25);border-radius:18px;padding:14px;background:rgba(255,250,242,.9);transition:transform .35s}
    .photo:hover{transform:translateY(-3px)}
    .img{height:260px;border-radius:14px;background:linear-gradient(135deg,#d4a574,#f0d9bc,#c4b0d4);position:relative;overflow:hidden}
    .img::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 25% 30%,rgba(255,255,255,.45),transparent 48%)}
    .copy{margin-top:10px;font-size:22px;line-height:1.35}
    .finale{margin-top:24px;border:1px solid rgba(200,160,120,.25);border-radius:22px;background:rgba(255,250,242,.9);padding:28px;text-align:center}
    .finale p{font-size:30px;line-height:1.45;min-height:110px}
    .sig{font-size:38px;color:#c87941;font-family:'Brush Script MT',cursive}
    .footer{margin-top:30px;padding-top:14px;border-top:1px solid rgba(200,160,120,.25);text-align:center}
    .footer small{display:block;font:600 11px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#8b6f5e}
    .footer a{display:inline-block;margin:8px 0;color:#c87941;font-size:22px;text-decoration:none}
    .conf{position:fixed;top:-18px;width:8px;height:16px;z-index:20;border-radius:2px;animation:drop 2s ease-in forwards}
    @keyframes drop{to{transform:translateY(106vh) rotate(420deg);opacity:0}}
    .cursor{display:inline-block;width:2px;height:1em;background:#c87941;vertical-align:bottom;animation:blink 1s steps(1,end) infinite}
    @keyframes blink{50%{opacity:0}}
  </style>
</head>
<body>
  <main>
    <div class="banner">
      <span>This card sings for you. Tap play on full cards.</span>
      <button style="border:0;border-radius:999px;padding:8px 14px;background:#c87941;color:#fff;font:600 12px system-ui">Demo</button>
    </div>
    <h1>Living Card Demo</h1>
    <p class="sub">A premium digital greeting card experience</p>
    <section class="grid">
      <article class="photo"><div class="img"></div><p class="copy">Scroll-driven reveals and handcrafted watercolor motion.</p></article>
      <article class="photo"><div class="img" style="background:linear-gradient(135deg,#c4b0d4,#f4eaf7,#d4a574)"></div><p class="copy">Interactive textures, ambient sound, and emotional storytelling.</p></article>
    </section>
    <section class="finale" id="finale"><p id="msg" data-text="Every card is a living, breathing work of art."></p><div class="sig">LiveCardStudio</div></section>
    <footer class="footer"><small>crafted with love on</small><a href="https://livecardstudio.com" target="_blank" rel="noopener">LiveCardStudio.com</a><small>living cards for the moments that matter</small></footer>
  </main>
  <script>
    (function(){
      const target = document.getElementById('msg');
      const text = target.getAttribute('data-text') || '';
      let i = 0;
      target.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'cursor';
      target.appendChild(cursor);
      function step(){
        if(i >= text.length){ cursor.remove(); return; }
        cursor.insertAdjacentText('beforebegin', text[i++]);
        setTimeout(step, 26);
      }
      setTimeout(step, 300);

      const obs = new IntersectionObserver((entries)=>{
        entries.forEach((entry)=>{
          if(entry.isIntersecting){
            for(let i=0;i<70;i++){
              const c=document.createElement('i');
              c.className='conf';
              c.style.left=Math.random()*100+'vw';
              c.style.background=i%3===0?'#c87941':i%3===1?'#d4a574':'#c4b0d4';
              c.style.animationDelay=(Math.random()*.6).toFixed(2)+'s';
              document.body.appendChild(c);
              setTimeout(()=>c.remove(),2200);
            }
            obs.disconnect();
          }
        });
      },{threshold:.7});
      obs.observe(document.getElementById('finale'));
    })();
  </script>
</body>
</html>`;
