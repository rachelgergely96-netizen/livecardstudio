/**
 * LiveCard Studio — shared card HTML builder for view page and dashboard.
 * Usage: LiveCardRender.buildCardHTML(cardRow) where cardRow has occasion, recipient_name, sender_name, message, theme, photos (JSON string or array of dataUrls).
 */
(function(global) {
  var defaultSubtitles = {
    birthday: 'wishing a very special',
    wedding: 'celebrating the love of',
    baby: 'welcoming with love',
    thankyou: 'with heartfelt gratitude for',
    holiday: 'warm wishes for',
    anniversary: 'celebrating the love of',
    getwell: 'sending healing thoughts to',
    congrats: 'so proud of'
  };
  var defaultTitles = {
    birthday: 'Happy Birthday',
    wedding: 'Congratulations',
    baby: 'Welcome Little One',
    thankyou: 'Thank You',
    holiday: 'Happy Holidays',
    anniversary: 'Happy Anniversary',
    getwell: 'Get Well Soon',
    congrats: 'Congratulations'
  };
  var defaultMessages = {
    birthday: "Wishing you a day painted with joy,\nwarmth, and all the colors of happiness.\n\nMay this year bring you\nbeautiful new brushstrokes\non the canvas of your life.",
    wedding: "Two hearts, one beautiful story.\n\nMay your love be a masterpiece\nthat grows more exquisite\nwith every passing year.",
    baby: "Welcome to the world, little one.\n\nYou are the most beautiful\nwork of art we've ever seen.\nThe world is brighter\nnow that you're here.",
    thankyou: "Some people make the world\nmore beautiful just by being in it.\n\nThank you for being one of them.\nYour kindness is a gift\nI carry with me always.",
    holiday: "Wishing you a season\nfilled with warmth, wonder,\nand moments that shimmer\nlike the most beautiful painting.\n\nMay the new year bring\nfresh colors to your world.",
    anniversary: "Year after year,\nyour love paints something\nmore beautiful than the last.\n\nHere's to the masterpiece\nyou continue to create together.",
    getwell: "Sending you gentle colors\nof warmth and healing.\n\nMay each day bring you\na little more brightness,\na little more strength,\nand the comfort of knowing\nyou are deeply loved.",
    congrats: "What an incredible moment!\n\nYou've painted something\ntruly extraordinary,\nand the world is\nmore beautiful for it.\n\nCheers to you and\nall that's ahead."
  };
  var themes = {
    watercolor: {
      bg: '#FDF6EC',
      textColor: '#8B6F5C',
      accentColor: '#C4727F',
      goldColor: '#D4A853',
      borderTop: 'linear-gradient(90deg, transparent, #E8A0B4, #C9B8D9, #A8B5A0, transparent)',
      borderBot: 'linear-gradient(90deg, transparent, #F0C5A8, #D4A853, #E8A0B4, transparent)',
      blobs: [
        {r:232,g:160,b:180,a:0.06},{r:201,g:184,b:217,a:0.05},{r:168,g:181,b:160,a:0.05},
        {r:240,g:197,b:168,a:0.055},{r:212,g:168,b:83,a:0.035},{r:196,g:180,b:200,a:0.04},
        {r:180,g:210,b:200,a:0.04},{r:220,g:170,b:190,a:0.045},{r:190,g:200,b:180,a:0.035}
      ],
      petals: ['rgba(232,160,180,','rgba(201,184,217,','rgba(212,168,83,','rgba(240,197,168,','rgba(168,181,160,','rgba(196,114,127,'],
      frame: 'linear-gradient(145deg,#D4A853,#E8C97A,#B8903E,#D4A853,#E8C97A)',
      frameInner: '#F5EDE0',
      badgeColors: ['#C4727F','#8B6F5C','#5B8FAF','#A09888','#E8467C','#6B7F62','#9B7CB8','#B8903E']
    },
    starlit: {
      bg: '#0C1225',
      textColor: '#C8C0D8',
      accentColor: '#D4A853',
      goldColor: '#8BA4C4',
      borderTop: 'linear-gradient(90deg, transparent, #D4A853, #8BA4C4, #D4A853, transparent)',
      borderBot: 'linear-gradient(90deg, transparent, #8BA4C4, #C9C0D9, #D4A853, transparent)',
      blobs: [
        {r:30,g:50,b:100,a:0.08},{r:80,g:100,b:160,a:0.05},{r:100,g:80,b:140,a:0.04},
        {r:212,g:168,b:83,a:0.025},{r:60,g:80,b:130,a:0.06},{r:140,g:130,b:180,a:0.035},
        {r:50,g:70,b:120,a:0.05},{r:90,g:110,b:160,a:0.04},{r:70,g:60,b:110,a:0.045}
      ],
      petals: ['rgba(212,168,83,','rgba(200,200,230,','rgba(140,170,210,','rgba(180,170,210,','rgba(255,230,160,','rgba(160,180,220,'],
      frame: 'linear-gradient(145deg,#3A3550,#4A4565,#2A2540,#3A3550,#4A4565)',
      frameInner: '#1A1830',
      badgeColors: ['#D4A853','#6B80A0','#8B7AB0','#A09888','#C4A050','#708090','#9B7CB8','#B8903E']
    },
    golden: {
      bg: '#FBF5EA',
      textColor: '#7A5C40',
      accentColor: '#C47850',
      goldColor: '#D4A853',
      borderTop: 'linear-gradient(90deg, transparent, #D4A853, #E8C080, #C47850, transparent)',
      borderBot: 'linear-gradient(90deg, transparent, #C47850, #D4A853, #E8C080, transparent)',
      blobs: [
        {r:212,g:168,b:83,a:0.06},{r:232,g:192,b:128,a:0.05},{r:196,g:120,b:80,a:0.04},
        {r:245,g:230,b:208,a:0.06},{r:220,g:180,b:100,a:0.04},{r:200,g:150,b:100,a:0.035},
        {r:240,g:210,b:160,a:0.045},{r:180,g:140,b:90,a:0.03},{r:230,g:200,b:140,a:0.04}
      ],
      petals: ['rgba(212,168,83,','rgba(232,192,128,','rgba(196,120,80,','rgba(245,230,208,','rgba(220,180,100,','rgba(200,160,110,'],
      frame: 'linear-gradient(145deg,#D4A853,#E8C97A,#B8903E,#D4A853,#E8C97A)',
      frameInner: '#F8F0E0',
      badgeColors: ['#C47850','#8B6F5C','#B8903E','#A09060','#D4A853','#907050','#C49060','#8B7040']
    },
    blossom: {
      bg: '#FFF8FA',
      textColor: '#8B6070',
      accentColor: '#D4829A',
      goldColor: '#98C9A3',
      borderTop: 'linear-gradient(90deg, transparent, #F4B4C8, #98C9A3, #FCDCE8, transparent)',
      borderBot: 'linear-gradient(90deg, transparent, #98C9A3, #F4B4C8, #FCDCE8, transparent)',
      blobs: [
        {r:244,g:180,b:200,a:0.06},{r:252,g:220,b:232,a:0.05},{r:152,g:201,b:163,a:0.04},
        {r:255,g:240,b:245,a:0.05},{r:230,g:170,b:190,a:0.045},{r:180,g:220,b:190,a:0.035},
        {r:250,g:200,b:215,a:0.04},{r:170,g:210,b:180,a:0.03},{r:240,g:190,b:205,a:0.04}
      ],
      petals: ['rgba(244,180,200,','rgba(252,220,232,','rgba(255,200,215,','rgba(230,170,190,','rgba(152,201,163,','rgba(250,190,210,'],
      frame: 'linear-gradient(145deg,#E8C0D0,#F0D0E0,#D0A8B8,#E8C0D0,#F0D0E0)',
      frameInner: '#FFF5F7',
      badgeColors: ['#D4829A','#98C9A3','#B08898','#A0B8A8','#E890A8','#80B090','#C090B0','#A8C0A0']
    }
  };
  var v2ThemeTemplates = {
    aurora: '/themes/v2-aurora-dreams.html',
    constellation: '/themes/v2-constellation.html',
    gardenbloom: '/themes/v2-garden-bloom.html',
    gentletide: '/themes/v2-gentle-tide.html',
    goldenhour: '/themes/v2-golden-hour.html',
    iridescent: '/themes/v2-iridescent-butterflies.html',
    lantern: '/themes/v2-lantern-festival.html',
    lotus: '/themes/v2-lotus-ceremony.html',
    bioluminescence: '/themes/v2-deep-bioluminescence.html',
    midnightrain: '/themes/v2-midnight-rain.html',
    paperboats: '/themes/v2-paper-boats.html',
    petaldrift: '/themes/v2-petal-drift.html',
    risingembers: '/themes/v2-rising-embers.html',
    sakura: '/themes/v2-sakura-wind.html',
    firefly: '/themes/v2-firefly-meadow.html',
    wishbottles: '/themes/v2-wish-bottles.html',
    dandelions: '/themes/v2-wishing-dandelions.html'
  };
  var v2TemplateCache = {};

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function isV2Theme(theme) {
    return !!(theme && hasOwn(v2ThemeTemplates, theme));
  }

  function getPhotos(card) {
    var photos = card && card.photos;
    if (typeof photos === 'string') {
      try { photos = JSON.parse(photos); } catch (e) { photos = []; }
    }
    if (!Array.isArray(photos)) photos = [];
    return photos;
  }

  function getPrimaryPhoto(card) {
    var photos = getPhotos(card);
    for (var i = 0; i < photos.length; i++) {
      var src = typeof photos[i] === 'string' ? photos[i] : (photos[i] && photos[i].dataUrl) || '';
      if (src) return src;
    }
    return '';
  }

  function parseMessageData(card, occasion) {
    var fallback = defaultMessages[occasion] || defaultMessages.birthday;
    var out = {
      title: '',
      text: fallback,
      sectionMessages: [],
      musicStyle: 'music_box_birthday',
      features: {
        photoInteractions: true,
        brushReveal: true,
        paintCanvas: true,
        confettiFinale: true
      },
      gift: null
    };

    var raw = card && card.message;
    var parsed = null;

    if (typeof raw === 'string') {
      var trimmed = raw.trim();
      if (trimmed && trimmed.charAt(0) === '{') {
        try { parsed = JSON.parse(trimmed); } catch (_e) {}
      }
      if (!parsed && trimmed) out.text = raw;
    } else if (raw && typeof raw === 'object') {
      parsed = raw;
    }

    if (!parsed) return out;

    if (typeof parsed.title === 'string' && parsed.title.trim()) out.title = parsed.title.trim();
    if (typeof parsed.text === 'string' && parsed.text.trim()) out.text = parsed.text;
    if (typeof parsed.message === 'string' && parsed.message.trim()) out.text = parsed.message;
    if (Array.isArray(parsed.sectionMessages)) {
      out.sectionMessages = parsed.sectionMessages.filter(function(x) {
        return typeof x === 'string' && x.trim();
      });
    }
    if (parsed.musicStyle) {
      out.musicStyle = String(parsed.musicStyle).toLowerCase().replace(/[\s-]+/g, '_');
    }
    if (parsed.features && typeof parsed.features === 'object') {
      if (typeof parsed.features.photoInteractions === 'boolean') out.features.photoInteractions = parsed.features.photoInteractions;
      if (typeof parsed.features.brushReveal === 'boolean') out.features.brushReveal = parsed.features.brushReveal;
      if (typeof parsed.features.paintCanvas === 'boolean') out.features.paintCanvas = parsed.features.paintCanvas;
      if (typeof parsed.features.confettiFinale === 'boolean') out.features.confettiFinale = parsed.features.confettiFinale;
    }
    if (parsed.gift && typeof parsed.gift === 'object') {
      var amount = Number(parsed.gift.amount);
      var gift = {
        enabled: parsed.gift.enabled !== false,
        brand: String(parsed.gift.brand || '').trim(),
        amount: isNaN(amount) ? 0 : amount,
        redemptionUrl: String(parsed.gift.redemptionUrl || parsed.gift.redemption_url || '').trim()
      };
      if (gift.enabled && (gift.brand || gift.amount > 0 || gift.redemptionUrl)) {
        out.gift = gift;
      }
    }

    return out;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function replaceTagContent(html, className, content) {
    var pattern = new RegExp('(<[^>]*class="' + className + '"[^>]*>)([\\s\\S]*?)(<\\/[^>]+>)');
    return html.replace(pattern, function(_, open, _old, close) {
      return open + content + close;
    });
  }

  var musicProfiles = {
    music_box_birthday: { label: 'Music Box Birthday', themeType: 'celebration', volume: 0.8 },
    ambient_warm: { label: 'Warm Ambient Pads', themeType: 'garden', volume: 0.72 },
    gentle_piano: { label: 'Gentle Piano', themeType: 'garden', volume: 0.66 },
    celestial_pads: { label: 'Celestial Pads', themeType: 'starfield', volume: 0.76 },
    soft_guitar: { label: 'Soft Guitar', themeType: 'ocean', volume: 0.7 }
  };

  function resolveThemeTypeFromTheme(theme) {
    var key = String(theme || '').toLowerCase();
    if (!key) return 'starfield';
    if (key.indexOf('ember') !== -1 || key.indexOf('lantern') !== -1) return 'fire';
    if (key.indexOf('tide') !== -1 || key.indexOf('boat') !== -1 || key.indexOf('wish') !== -1) return 'ocean';
    if (
      key.indexOf('garden') !== -1 ||
      key.indexOf('bloom') !== -1 ||
      key.indexOf('petal') !== -1 ||
      key.indexOf('sakura') !== -1 ||
      key.indexOf('blossom') !== -1 ||
      key.indexOf('firefly') !== -1 ||
      key.indexOf('lotus') !== -1 ||
      key.indexOf('dandelion') !== -1
    ) {
      return 'garden';
    }
    if (key.indexOf('golden') !== -1 || key.indexOf('birthday') !== -1 || key.indexOf('celebration') !== -1) {
      return 'celebration';
    }
    return 'starfield';
  }

  function getMusicProfile(musicStyle, theme) {
    var key = String(musicStyle || '').toLowerCase().replace(/[\s-]+/g, '_');
    if (!key || key === 'none') return null;
    if (hasOwn(musicProfiles, key)) return musicProfiles[key];
    return {
      label: 'Ambient Sound',
      themeType: resolveThemeTypeFromTheme(theme),
      volume: 0.72
    };
  }

  function buildSoundInjection(recipient, musicStyle, theme) {
    var profile = getMusicProfile(musicStyle, theme);
    if (!profile) return { head: '', body: '' };

    var safeRecipient = escapeHtml(recipient || 'you');
    var promptLabel = escapeHtml(profile.label || 'ambient music');
    var config = {
      themeType: profile.themeType || 'starfield',
      volume: typeof profile.volume === 'number' ? profile.volume : 0.72
    };

    var head = '<style>' +
      '.lc-audio-banner{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:1200;display:flex;align-items:center;gap:10px;max-width:min(92vw,620px);padding:10px 14px;border-radius:999px;background:rgba(253,248,240,.94);border:1px solid rgba(200,121,65,.28);box-shadow:0 8px 24px rgba(0,0,0,.12);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-family:"Cormorant Garamond",serif;font-size:.94rem;color:#4a3a32;transition:opacity .35s ease,transform .35s ease}' +
      '.lc-audio-banner.dismissed{opacity:0;pointer-events:none;transform:translate(-50%,-12px)}' +
      '.lc-audio-banner-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.lc-audio-btn{border:none;border-radius:999px;background:#c87941;color:#fff;padding:7px 13px;font-family:"Outfit",sans-serif;font-size:.64rem;letter-spacing:1.2px;text-transform:uppercase;cursor:pointer}' +
      '.lc-audio-close{border:none;background:transparent;color:#8b6f5e;font-size:1.2rem;line-height:1;cursor:pointer;padding:0 2px}' +
      '.lc-audio-toggle{position:fixed;left:16px;bottom:16px;z-index:1200;width:46px;height:46px;border:none;border-radius:50%;background:rgba(253,248,240,.95);border:1px solid rgba(200,121,65,.35);box-shadow:0 10px 24px rgba(0,0,0,.16);display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#8b6f5e;cursor:pointer}' +
      '.lc-audio-toggle.is-playing{color:#c87941;border-color:rgba(200,121,65,.6)}' +
      '.lc-audio-prompt{position:fixed;left:72px;bottom:24px;z-index:1200;padding:7px 12px;border-radius:999px;background:rgba(253,248,240,.92);border:1px solid rgba(200,121,65,.24);font-family:"Cormorant Garamond",serif;font-size:.82rem;color:#5a4a3f;transition:opacity .25s ease}' +
      '.lc-audio-prompt.hidden{opacity:0;pointer-events:none}' +
      '@media(max-width:640px){.lc-audio-banner{top:10px;gap:8px;padding:8px 10px;font-size:.82rem}.lc-audio-btn{padding:6px 10px;font-size:.58rem;letter-spacing:1px}.lc-audio-toggle{width:42px;height:42px;left:12px;bottom:12px}.lc-audio-prompt{left:62px;bottom:18px;font-size:.76rem;padding:6px 10px}}' +
      '</style>';

    var script = '(function(){' +
      'var cfg=' + JSON.stringify(config) + ';' +
      'var banner=document.getElementById("lcAudioBanner");' +
      'var playBtn=document.getElementById("lcAudioPlay");' +
      'var dismissBtn=document.getElementById("lcAudioDismiss");' +
      'var toggle=document.getElementById("lcAudioToggle");' +
      'var prompt=document.getElementById("lcAudioPrompt");' +
      'var storageKey="livecard_audio_muted";' +
      'var engine=null,started=false,muted=false,tapTs=0;' +
      'function getMuted(){try{return sessionStorage.getItem(storageKey)==="1";}catch(_e){return false}}' +
      'function setMuted(v){try{sessionStorage.setItem(storageKey,v?"1":"0")}catch(_e){}}' +
      'function ensureEngine(){if(!window.AmbientSoundEngine)return null;if(!engine){engine=new AmbientSoundEngine(cfg.themeType||"starfield");engine.setVolume(0)}return engine}' +
      'function prime(){var e=ensureEngine();if(e&&e.ctx&&e.ctx.state!=="running"){e.ctx.resume().catch(function(){})}}' +
      'function hideBanner(){if(banner)banner.classList.add("dismissed")}' +
      'function setUI(isPlaying){if(toggle){toggle.classList.toggle("is-playing",!!isPlaying);toggle.setAttribute("aria-pressed",isPlaying?"true":"false")}if(playBtn)playBtn.textContent=isPlaying?"Pause":"Play";if(prompt)prompt.classList.add("hidden")}' +
      'function applyVol(){if(engine)engine.setVolume(muted?0:Number(cfg.volume||0.72))}' +
      'function startAudio(){var e=ensureEngine();if(!e){if(prompt){prompt.textContent="Audio unavailable in this browser.";prompt.classList.remove("hidden")}return}Promise.resolve(e.start()).then(function(){prime();muted=false;setMuted(false);started=true;applyVol();setUI(true);hideBanner()}).catch(function(){})}' +
      'function stopAudio(){if(!engine)return;muted=true;setMuted(true);applyVol();setUI(false)}' +
      'function toggleAudio(ev){if(ev){ev.preventDefault();ev.stopPropagation()}var now=Date.now();if(now-tapTs<240)return;tapTs=now;prime();if(!started||muted){startAudio()}else{stopAudio()}}' +
      'muted=getMuted();' +
      'if(toggle){toggle.addEventListener("click",toggleAudio);toggle.addEventListener("touchstart",toggleAudio,{passive:false})}' +
      'if(playBtn){playBtn.addEventListener("click",toggleAudio);playBtn.addEventListener("touchstart",toggleAudio,{passive:false})}' +
      'if(banner){banner.addEventListener("click",function(e){if(dismissBtn&&e.target===dismissBtn)return;toggleAudio(e)})}' +
      'if(dismissBtn){dismissBtn.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();hideBanner();if(prompt)prompt.classList.add("hidden")})}' +
      'document.addEventListener("pointerdown",prime,{capture:true,passive:true});' +
      'document.addEventListener("touchstart",prime,{capture:true,passive:true});' +
      'document.addEventListener("click",prime,{capture:true});' +
      'document.addEventListener("visibilitychange",function(){if(!engine)return;if(document.hidden){engine.setVolume(0);return}prime();if(started&&!muted)engine.setVolume(Number(cfg.volume||0.72))});' +
      'setUI(false);' +
      'setTimeout(function(){if(prompt&&!started)prompt.classList.add("hidden")},14000);' +
      '})();';

    var body =
      '<div class="lc-audio-banner" id="lcAudioBanner" role="status" aria-live="polite">' +
        '<span class="lc-audio-banner-text">&#9835; This card sings for ' + safeRecipient + ' - tap to hear it</span>' +
        '<button type="button" class="lc-audio-btn" id="lcAudioPlay">Play</button>' +
        '<button type="button" class="lc-audio-close" id="lcAudioDismiss" aria-label="Dismiss sound prompt">&times;</button>' +
      '</div>' +
      '<button type="button" class="lc-audio-toggle" id="lcAudioToggle" aria-label="Toggle card sound" aria-pressed="false">&#9835;</button>' +
      '<div class="lc-audio-prompt" id="lcAudioPrompt">Tap to hear ' + promptLabel + '</div>' +
      '<script src="/js/ambient-sound-engine.js"><\/script>' +
      '<script>' + script + '<\/script>';

    return { head: head, body: body };
  }

  function patchV2Template(rawTemplate, card) {
    var occasion = card.occasion || 'birthday';
    var parsed = parseMessageData(card, occasion);
    var title = parsed.title || defaultTitles[occasion] || 'A Living Card For You';
    var recipient = card.recipient_name || 'Someone Special';
    var sender = card.sender_name || 'With love';
    var message = parsed.text || defaultMessages[occasion] || '';
    var photoSrc = getPrimaryPhoto(card);
    var html = rawTemplate;

    html = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>A Living Card For ' + escapeHtml(recipient) + '</title>');
    html = replaceTagContent(html, 'msg-occ', escapeHtml(title));
    html = replaceTagContent(html, 'msg-txt', escapeHtml(message).replace(/\n/g, '<br>'));
    html = replaceTagContent(html, 'msg-from', '- ' + escapeHtml(sender));
    html = replaceTagContent(html, 'env-from', 'for ' + escapeHtml(recipient));
    html = html.replace(/<a href="#">LiveCardStudio<\/a>/g, '<a href="/">LiveCardStudio</a>');

    if (photoSrc) {
      var photoScript = '<script>window.__LIVECARD_PHOTO__=' + JSON.stringify(photoSrc) + ';</script>';
      html = html.replace('<script>', photoScript + '<script>');
      html = html.replace(
        /function (initP|initPhoto)\(\)\{[\s\S]*?\}/,
        function(_m, fnName) {
          return 'function ' + fnName + '(){const f=document.getElementById("pf"),s=f.offsetWidth||280;pc.width=s;pc.height=s;function setOriginal(){if(typeof oD!=="undefined"){oD=pctx.getImageData(0,0,s,s)}if(typeof origData!=="undefined"){origData=pctx.getImageData(0,0,s,s)}}function fallback(){const gen=typeof genP==="function"?genP:(typeof genPhoto==="function"?genPhoto:null);if(gen){pctx.drawImage(gen(s,s),0,0)}setOriginal()}const src=window.__LIVECARD_PHOTO__;if(!src){fallback();return;}const img=new Image();img.onload=function(){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;if(!iw||!ih){fallback();return;}const sc=Math.max(s/iw,s/ih),dw=iw*sc,dh=ih*sc,dx=(s-dw)/2,dy=(s-dh)/2;pctx.clearRect(0,0,s,s);pctx.drawImage(img,dx,dy,dw,dh);setOriginal()};img.onerror=fallback;img.src=src}';
        }
      );
    }

    var soundInjection = buildSoundInjection(recipient, parsed.musicStyle, card.theme);
    if (soundInjection.head) {
      if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, soundInjection.head + '</head>');
      else html = soundInjection.head + html;
    }
    if (soundInjection.body) {
      if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, soundInjection.body + '</body>');
      else html += soundInjection.body;
    }

    return html;
  }

  function loadV2Template(path) {
    if (v2TemplateCache[path]) return v2TemplateCache[path];
    if (!global.fetch) {
      return Promise.reject(new Error('Fetch unavailable for V2 template loading'));
    }
    v2TemplateCache[path] = global.fetch(path).then(function(res) {
      if (!res.ok) throw new Error('Failed to fetch V2 template: ' + path);
      return res.text();
    });
    return v2TemplateCache[path];
  }

  function buildCardHTML(card) {
    if (!card || !card.theme) return '';
    if (isV2Theme(card.theme)) return '';
    var T = themes[card.theme] || themes.watercolor;
    var occasion = card.occasion || 'birthday';
    var parsed = parseMessageData(card, occasion);
    var subtitle = defaultSubtitles[occasion] || 'wishing a very special';
    var title = parsed.title || defaultTitles[occasion] || 'Happy Birthday';
    var recipient = card.recipient_name || 'Someone Special';
    var sender = card.sender_name || 'With love';
    var messagePlain = parsed.text || defaultMessages[occasion] || '';
    var message = escapeHtml(messagePlain).replace(/\n/g, '<br>');
    var photos = getPhotos(card);
    var photoHTML = '';
    for (var i = 0; i < photos.length; i++) {
      var src = typeof photos[i] === 'string' ? photos[i] : (photos[i] && photos[i].dataUrl) || '';
      if (!src) continue;
      photoHTML += '<div class="painting filter-none" id="painting' + (i + 1) + '">' +
        '<span class="style-badge" id="badge' + (i + 1) + '"></span>' +
        '<div class="frame"><div class="frame-inner"><div class="img-wrapper">' +
        '<img src="' + src.replace(/"/g, '&quot;') + '" alt="Photo">' +
        '</div></div></div>' +
        '<p class="painting-label">' + (photos.length > 1 ? (i === 0 ? 'I' : 'II') : '') + '</p></div>';
    }
    var blobsJS = 'var blobDefs = ' + JSON.stringify(T.blobs) + ';';
    var petalsJS = 'var petalColors = ' + JSON.stringify(T.petals) + ';';
    var badgeColorsJS = JSON.stringify(T.badgeColors);
    var typewriterTextJS = JSON.stringify(messagePlain);
    var soundInjection = buildSoundInjection(recipient, parsed.musicStyle, card.theme);
    var giftHTML = '';
    if (parsed.gift && parsed.gift.enabled) {
      var giftAmount = parsed.gift.amount > 0 ? ('$' + parsed.gift.amount.toFixed(2)) : 'Gift Included';
      var giftCTA = parsed.gift.redemptionUrl
        ? '<a class="gift-redeem" href="' + parsed.gift.redemptionUrl.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">Redeem Gift</a>'
        : '<button class="gift-redeem" type="button" disabled>Gift unlocks when sent</button>';
      giftHTML =
        '<div class="gift-wrap">' +
          '<p class="gift-kicker">A little gift is tucked inside</p>' +
          '<p class="gift-title">' + escapeHtml(parsed.gift.brand || 'Special Gift') + ' · ' + escapeHtml(giftAmount) + '</p>' +
          giftCTA +
        '</div>';
    }

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
      '<title>A Card For ' + escapeHtml(recipient) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">' +
      '<svg style="position:absolute;width:0;height:0"><defs>' +
      '<filter id="oil-painting" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency="0.015 0.02" numOctaves="3" seed="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="6" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="0.8" result="s"/><feColorMatrix in="s" type="saturate" values="1.4"/></filter>' +
      '<filter id="watercolor" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency="0.008 0.012" numOctaves="4" seed="5" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="14" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="1.8" result="b"/><feColorMatrix in="b" type="saturate" values="1.5" result="sat"/><feComponentTransfer in="sat"><feFuncR type="linear" slope="0.95" intercept="0.08"/><feFuncG type="linear" slope="0.93" intercept="0.07"/><feFuncB type="linear" slope="0.88" intercept="0.06"/></feComponentTransfer></filter>' +
      '<filter id="pencil-sketch" x="-2%" y="-2%" width="104%" height="104%"><feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0" result="gray"/><feComponentTransfer in="gray" result="cg"><feFuncR type="linear" slope="1.8" intercept="-0.3"/><feFuncG type="linear" slope="1.8" intercept="-0.3"/><feFuncB type="linear" slope="1.8" intercept="-0.3"/></feComponentTransfer><feConvolveMatrix in="gray" order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" result="edges"/><feComponentTransfer in="edges" result="inv"><feFuncR type="table" tableValues="1 0"/><feFuncG type="table" tableValues="1 0"/><feFuncB type="table" tableValues="1 0"/></feComponentTransfer><feComponentTransfer in="inv" result="dk"><feFuncR type="linear" slope="5" intercept="-2"/><feFuncG type="linear" slope="5" intercept="-2"/><feFuncB type="linear" slope="5" intercept="-2"/></feComponentTransfer><feBlend in="cg" in2="dk" mode="multiply" result="sketch"/><feColorMatrix in="sketch" type="matrix" values="1 .02 0 0 .04 0 .97 .02 0 .03 0 0 .86 0 0 0 0 0 1 0"/></filter>' +
      '<filter id="pop-art"><feComponentTransfer result="p"><feFuncR type="discrete" tableValues="0 .15 .35 .55 .8 1"/><feFuncG type="discrete" tableValues="0 .15 .35 .55 .8 1"/><feFuncB type="discrete" tableValues="0 .15 .35 .55 .8 1"/></feComponentTransfer><feColorMatrix in="p" type="saturate" values="2.5" result="s"/><feComponentTransfer in="s"><feFuncR type="linear" slope="1.3" intercept="-0.05"/><feFuncG type="linear" slope="1.3" intercept="-0.05"/><feFuncB type="linear" slope="1.3" intercept="-0.05"/></feComponentTransfer></filter>' +
      '<filter id="dreamy" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/><feComponentTransfer in="b" result="bb"><feFuncR type="linear" slope="1.3" intercept="0.05"/><feFuncG type="linear" slope="1.25" intercept="0.04"/><feFuncB type="linear" slope="1.35" intercept="0.06"/></feComponentTransfer><feBlend in="SourceGraphic" in2="bb" mode="screen" result="g"/><feColorMatrix in="g" type="matrix" values=".95 .05 .05 0 .02 .03 .9 .05 0 .01 .05 .08 .95 0 .04 0 0 0 1 0" result="t"/><feColorMatrix in="t" type="saturate" values="0.8"/></filter>' +
      '<filter id="vintage" x="-5%" y="-5%" width="110%" height="110%"><feColorMatrix type="matrix" values=".55 .35 .15 0 .03 .25 .50 .15 0 .02 .15 .25 .40 0 0 0 0 0 1 0" result="s"/><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="3" result="grain"/><feColorMatrix in="grain" type="saturate" values="0" result="gg"/><feBlend in="s" in2="gg" mode="multiply" result="gr"/><feComponentTransfer in="gr"><feFuncR type="linear" slope="1.1" intercept="0.05"/><feFuncG type="linear" slope="1.05" intercept="0.03"/><feFuncB type="linear" slope="0.95" intercept="0"/></feComponentTransfer></filter>' +
      '</defs></svg>' +
      '<style>' +
      '*{margin:0;padding:0;box-sizing:border-box}' +
      'body{background:' + T.bg + ';font-family:"Cormorant Garamond",serif;overflow-x:hidden;cursor:crosshair;min-height:100vh;color:' + T.textColor + '}' +
      '#bgCanvas,#ptCanvas{position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none}' +
      '#bgCanvas{z-index:0}#ptCanvas{z-index:3}' +
      '.content{position:relative;z-index:2;max-width:820px;margin:0 auto;padding:40px 20px 60px}' +
      '.opening{text-align:center;padding:60px 20px 40px;opacity:0;animation:fu 2s cubic-bezier(.23,1,.32,1) .5s forwards}' +
      '.wb{width:140px;height:3px;margin:0 auto 30px;background:' + T.borderTop + ';opacity:0;animation:si 1.5s ease-out .8s forwards}' +
      '.sub{font-size:1.1rem;font-weight:300;letter-spacing:5px;text-transform:uppercase;opacity:0;animation:fu 1.5s ease-out 1s forwards}' +
      '.mt{font-family:"Dancing Script",cursive;font-size:clamp(3rem,8vw,5rem);color:' + T.accentColor + ';margin:12px 0;line-height:1.15;opacity:0;animation:fu 1.5s ease-out 1.3s forwards;text-shadow:0 2px 20px ' + T.accentColor + '22}' +
      '.gn{font-family:"Playfair Display",serif;font-size:clamp(1.8rem,4.5vw,2.8rem);font-weight:400;font-style:italic;color:' + T.goldColor + ';opacity:0;animation:fu 1.5s ease-out 1.6s forwards}' +
      '.wb2{width:200px;height:2px;margin:25px auto 0;background:' + T.borderBot + ';opacity:0;animation:si 1.5s ease-out 1.8s forwards}' +
      '.ph{text-align:center;margin:35px 0 10px;font-style:italic;font-size:.95rem;opacity:0;animation:fu 1.5s ease-out 2.2s forwards}' +
      '.bi{display:inline-block;animation:wg 1.5s ease-in-out 4s 3}' +
      '.gallery{display:flex;flex-wrap:wrap;justify-content:center;gap:40px;padding:25px 0 10px;opacity:0;animation:fu 1.8s ease-out 2s forwards}' +
      '.painting{position:relative;cursor:pointer;transition:transform .5s cubic-bezier(.23,1,.32,1);-webkit-tap-highlight-color:transparent}' +
      '.painting:hover{transform:scale(1.03) rotate(0)!important;z-index:4}' +
      '.painting:active{transform:scale(.97)!important}' +
      '.painting:nth-child(1){transform:rotate(-1.5deg)}.painting:nth-child(2){transform:rotate(1.2deg)}' +
      '.frame{position:relative;padding:14px;background:' + T.frame + ';border-radius:3px;box-shadow:0 10px 40px rgba(0,0,0,.2),inset 0 1px 0 rgba(255,255,255,.3)}' +
      '.frame::before{content:"";position:absolute;inset:5px;border:1px solid rgba(255,255,255,.25);border-radius:2px;pointer-events:none}' +
      '.frame-inner{padding:4px;background:' + T.frameInner + ';overflow:hidden}' +
      '.img-wrapper{width:280px;overflow:hidden}' +
      '.painting img{display:block;width:100%;height:auto;transition:filter .7s ease}' +
      '.filter-none img{filter:none}.filter-oil img{filter:url(#oil-painting)}.filter-watercolor img{filter:url(#watercolor)}.filter-sketch img{filter:url(#pencil-sketch)}.filter-popart img{filter:url(#pop-art)}.filter-dreamy img{filter:url(#dreamy)}.filter-vintage img{filter:url(#vintage)}' +
      '.style-badge{position:absolute;top:-12px;right:-12px;color:#fff;font-size:.72rem;font-style:italic;letter-spacing:1.5px;padding:5px 14px;border-radius:14px;z-index:5;opacity:0;transform:scale(.7) translateY(5px);transition:all .4s cubic-bezier(.23,1,.32,1);text-transform:uppercase;white-space:nowrap;box-shadow:0 3px 12px rgba(0,0,0,.25)}' +
      '.style-badge.visible{opacity:1;transform:scale(1) translateY(0)}' +
      '.painting-label{text-align:center;margin-top:14px;font-style:italic;font-size:.9rem;letter-spacing:1px}' +
      '.tp{text-align:center;margin:8px 0 20px;opacity:0;animation:fu 1.5s ease-out 2.5s forwards}' +
      '.tp-inner{display:inline-flex;align-items:center;gap:10px;background:' + T.bg + 'cc;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1.5px solid ' + T.accentColor + '33;border-radius:24px;padding:10px 22px;font-style:italic;font-size:.95rem;color:' + T.accentColor + ';animation:pp 2.5s ease-in-out 4s 4}' +
      '.th{font-style:normal;font-size:1.2rem;animation:tb 1.6s ease-in-out 4s 5}' +
      '.fd{display:flex;align-items:center;justify-content:center;gap:20px;margin:15px 0 40px;opacity:0;animation:fu 1.5s ease-out 2.8s forwards}' +
      '.fl{width:100px;height:1px;background:linear-gradient(90deg,transparent,' + T.accentColor + '55,transparent)}' +
      '.fi{animation:gs 12s ease-in-out infinite;font-size:1.1rem;opacity:.5}' +
      '.ms{text-align:center;padding:10px 30px 40px;opacity:0;animation:fu 1.8s ease-out 3s forwards}' +
      '.msg{font-size:1.3rem;line-height:2;max-width:550px;margin:0 auto;font-weight:300}' +
      '.sig{margin-top:40px;font-family:"Dancing Script",cursive;font-size:2rem;color:' + T.accentColor + '}' +
      '.hts{margin-top:12px;font-size:1.2rem;opacity:.6;letter-spacing:10px}' +
      '.bf{text-align:center;padding:20px 0 50px;opacity:0;animation:fu 1.5s ease-out 3.3s forwards}' +
      '.gift-wrap{max-width:520px;margin:20px auto 40px;padding:18px 16px;border-radius:14px;background:' + T.bg + 'e8;border:1px solid ' + T.accentColor + '33;text-align:center;box-shadow:0 10px 24px rgba(0,0,0,.1)}' +
      '.gift-kicker{font-family:"Outfit",sans-serif;font-size:.66rem;letter-spacing:2px;text-transform:uppercase;opacity:.65}' +
      '.gift-title{margin:8px 0 12px;font-family:"Playfair Display",serif;font-size:1.1rem}' +
      '.gift-redeem{display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:999px;padding:8px 14px;background:' + T.accentColor + ';color:#fff;text-decoration:none;font-family:"Outfit",sans-serif;font-size:.72rem;letter-spacing:1px;text-transform:uppercase}' +
      '.gift-redeem:disabled{opacity:.6;cursor:not-allowed}' +
      '.type-cursor{display:inline-block;width:2px;height:1.1em;background:' + T.accentColor + ';vertical-align:text-bottom;animation:blink 1s steps(1,end) infinite}' +
      '.ps{position:fixed;pointer-events:none;z-index:10;opacity:0;animation:sin 4s ease-out forwards}' +
      '.pd{position:fixed;pointer-events:none;z-index:10;border-radius:50%;opacity:0;animation:din 2.5s ease-out forwards}' +
      '@keyframes fu{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes si{from{opacity:0;transform:scaleX(0)}to{opacity:1;transform:scaleX(1)}}' +
      '@keyframes wg{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}' +
      '@keyframes gs{0%,100%{transform:rotate(0)}50%{transform:rotate(15deg)}}' +
      '@keyframes tb{0%,100%{transform:translateY(0) scale(1)}35%{transform:translateY(-6px) scale(1.2)}}' +
      '@keyframes pp{0%,100%{border-color:' + T.accentColor + '33;box-shadow:none}50%{border-color:' + T.accentColor + '77;box-shadow:0 0 0 8px ' + T.accentColor + '11}}' +
      '@keyframes blink{50%{opacity:0}}' +
      '@keyframes sin{0%{transform:scale(0) rotate(0);opacity:.9}15%{transform:scale(.5) rotate(15deg);opacity:.75}40%{opacity:.4}100%{transform:scale(1) rotate(40deg);opacity:0}}' +
      '@keyframes din{0%{transform:scale(0) translateY(0);opacity:.75}40%{opacity:.45}100%{transform:scale(1) translateY(18px);opacity:0}}' +
      '@media(max-width:640px){.gallery{gap:25px}.img-wrapper{width:230px}.frame{padding:10px}.content{padding:20px 15px 40px}.msg{font-size:1.1rem;padding:0 10px}.tp-inner{font-size:.82rem;padding:8px 16px}}' +
      '.powered{text-align:center;padding:10px 0 30px;font-family:"Outfit",sans-serif;font-size:.7rem;letter-spacing:2px;text-transform:uppercase;opacity:.3}' +
      '.powered a{color:inherit;text-decoration:none}' +
      '</style>' + soundInjection.head + '</head><body>' +
      soundInjection.body +
      '<canvas id="bgCanvas"></canvas><canvas id="ptCanvas"></canvas>' +
      '<div class="content">' +
      '<div class="opening"><div class="wb"></div>' +
      '<p class="sub">' + subtitle + '</p>' +
      '<h1 class="mt">' + escapeHtml(title) + '</h1>' +
      '<p class="gn">' + escapeHtml(recipient) + '</p>' +
      '<div class="wb2"></div></div>' +
      '<p class="ph"><span class="bi">&#127912;</span>&nbsp; touch anywhere to paint &nbsp;<span class="bi">&#128396;</span></p>' +
      '<div class="gallery">' + photoHTML + '</div>' +
      '<div class="tp"><div class="tp-inner"><span class="th">&#128072;</span> tap the paintings to transform them into art <span class="th">&#128072;</span></div></div>' +
      '<div class="fd"><div class="fl"></div><span class="fi">&#10047;</span><div class="fl"></div></div>' +
      '<div class="ms"><p class="msg" id="finaleMsg">' + message + '</p>' +
      '<p class="sig" id="finaleSig">' + escapeHtml(sender) + '</p>' +
      '<p class="hts">&#10084; &#10084; &#10084;</p></div>' +
      '<div class="bf"><svg width="50" height="50" viewBox="0 0 50 50" fill="none" style="animation:gs 10s ease-in-out infinite"><ellipse cx="25" cy="27" rx="20" ry="17" fill="' + T.bg + '" stroke="' + T.goldColor + '" stroke-width="1.5" opacity=".8"/><circle cx="15" cy="22" r="4" fill="' + T.accentColor + '" opacity=".6"/><circle cx="25" cy="17" r="3.5" fill="' + T.goldColor + '" opacity=".6"/><circle cx="34" cy="22" r="3.8" fill="' + T.accentColor + '88" opacity=".6"/></svg></div>' +
      giftHTML +
      '<div class="powered">Made with <a href="/">LiveCard Studio</a></div>' +
      '</div>' +
      '<script>' +
      '(function(){var c=document.getElementById("bgCanvas"),x=c.getContext("2d"),W,H;' +
      'function r(){W=c.width=innerWidth;H=c.height=innerHeight}r();addEventListener("resize",r);' +
      blobsJS +
      'var blobs=[];for(var i=0;i<blobDefs.length;i++){var d=blobDefs[i];blobs.push({x:Math.random()*W,y:Math.random()*H,r:150+Math.random()*250,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.25,c:d,ph:Math.random()*Math.PI*2,bs:.003+Math.random()*.004,ba:.15+Math.random()*.1})}' +
      'var pc=document.getElementById("ptCanvas"),px=pc.getContext("2d");' +
      'function rp(){pc.width=innerWidth;pc.height=innerHeight}rp();addEventListener("resize",rp);' +
      petalsJS +
      'var petals=[];for(var i=0;i<35;i++){petals.push({x:Math.random()*innerWidth,y:Math.random()*innerHeight*2-innerHeight*.5,sz:3+Math.random()*8,sy:.15+Math.random()*.35,sx:(Math.random()-.5)*.3,rot:Math.random()*Math.PI*2,rs:(Math.random()-.5)*.015,wa:15+Math.random()*25,ws:.001+Math.random()*.002,ph:Math.random()*Math.PI*2,col:petalColors[Math.floor(Math.random()*petalColors.length)],op:.15+Math.random()*.25,sh:Math.random()>.5?"p":"c"})}' +
      'function anim(t){' +
      'x.fillStyle="' + T.bg + '";x.fillRect(0,0,W,H);' +
      'for(var i=0;i<blobs.length;i++){var b=blobs[i];var br=1+Math.sin(t*b.bs+b.ph)*b.ba;var rr=b.r*br;b.x+=b.vx+Math.sin(t*.001+b.ph)*.15;b.y+=b.vy+Math.cos(t*.0008+b.ph)*.12;if(b.x<-rr)b.x=W+rr;if(b.x>W+rr)b.x=-rr;if(b.y<-rr)b.y=H+rr;if(b.y>H+rr)b.y=-rr;var g=x.createRadialGradient(b.x,b.y,0,b.x,b.y,rr);var a=b.c.a*(.8+.2*Math.sin(t*.002+b.ph));g.addColorStop(0,"rgba("+b.c.r+","+b.c.g+","+b.c.b+","+a+")");g.addColorStop(.5,"rgba("+b.c.r+","+b.c.g+","+b.c.b+","+(a*.4)+")");g.addColorStop(1,"rgba("+b.c.r+","+b.c.g+","+b.c.b+",0)");x.fillStyle=g;x.fillRect(0,0,W,H)}' +
      'px.clearRect(0,0,pc.width,pc.height);var sY=pageYOffset||0;' +
      'for(var i=0;i<petals.length;i++){var p=petals[i];p.y+=p.sy;p.x+=p.sx+Math.sin(t*p.ws+p.ph)*.5;p.rot+=p.rs;if(p.y>innerHeight+20){p.y=-20;p.x=Math.random()*innerWidth}var dy=p.y-sY*.15;px.save();px.translate(p.x,dy);px.rotate(p.rot);px.globalAlpha=p.op*(.7+.3*Math.sin(t*.003+p.ph));' +
      'if(p.sh==="p"){px.beginPath();px.moveTo(0,-p.sz);px.bezierCurveTo(p.sz*.8,-p.sz*.5,p.sz*.8,p.sz*.5,0,p.sz);px.bezierCurveTo(-p.sz*.8,p.sz*.5,-p.sz*.8,-p.sz*.5,0,-p.sz);px.fillStyle=p.col+p.op+")";px.fill()}' +
      'else{var gr=px.createRadialGradient(0,0,0,0,0,p.sz);gr.addColorStop(0,p.col+p.op+")");gr.addColorStop(1,p.col+"0)");px.fillStyle=gr;px.fillRect(-p.sz,-p.sz,p.sz*2,p.sz*2)}' +
      'px.restore()}' +
      'requestAnimationFrame(anim)}requestAnimationFrame(anim)})();' +
      '(function(){var f=["filter-none","filter-oil","filter-watercolor","filter-sketch","filter-popart","filter-dreamy","filter-vintage"];' +
      'var l=["Original","Oil Painting","Watercolor","Pencil Sketch","Pop Art","Dreamy","Vintage"];' +
      'var bc=' + badgeColorsJS + ';' +
      'function cyc(el,bg,cur){var n=(cur+1)%f.length;f.forEach(function(c){el.classList.remove(c)});el.classList.add(f[n]);if(n===0){bg.classList.remove("visible")}else{bg.textContent=l[n];bg.style.background=bc[n];bg.classList.add("visible")}return n}' +
      'var c1=0,c2=0;' +
      'var p1=document.getElementById("painting1");if(p1)p1.addEventListener("click",function(e){e.stopPropagation();c1=cyc(this,document.getElementById("badge1"),c1)});' +
      'var p2=document.getElementById("painting2");if(p2)p2.addEventListener("click",function(e){e.stopPropagation();c2=cyc(this,document.getElementById("badge2"),c2)});' +
      '})();' +
      '(function(){var cs=["rgba(219,84,130,.55)","rgba(130,60,200,.5)","rgba(50,180,120,.45)","rgba(240,140,40,.55)","rgba(50,130,230,.5)","rgba(230,50,70,.5)","rgba(255,200,40,.55)","rgba(100,200,180,.45)","rgba(210,80,180,.5)","rgba(80,170,255,.45)","rgba(255,120,80,.5)","rgba(160,100,220,.45)"];' +
      'function sp(x,y){var e=document.createElement("div");e.className="ps";var s=90+Math.random()*180;var c=cs[Math.floor(Math.random()*cs.length)];e.style.cssText="left:"+(x-s/2)+"px;top:"+(y-s/2)+"px;width:"+s+"px;height:"+s+"px;background:radial-gradient(ellipse at "+(30+Math.random()*40)+"% "+(30+Math.random()*40)+"%,"+c+",transparent 55%);transform:rotate("+(Math.random()*360)+"deg);border-radius:"+(35+Math.random()*25)+"% "+(45+Math.random()*25)+"% "+(35+Math.random()*25)+"% "+(45+Math.random()*25)+"%";document.body.appendChild(e);setTimeout(function(){e.remove()},4000);' +
      'for(var i=0;i<2+Math.floor(Math.random()*3);i++){(function(j){setTimeout(function(){var d=document.createElement("div");d.className="pd";var ds=10+Math.random()*28;var c2=cs[Math.floor(Math.random()*cs.length)];d.style.cssText="left:"+(x+(Math.random()-.5)*s-ds/2)+"px;top:"+(y+(Math.random()-.5)*s-ds/2)+"px;width:"+ds+"px;height:"+ds+"px;background:radial-gradient(circle,"+c2+",transparent 60%)";document.body.appendChild(d);setTimeout(function(){d.remove()},2500)},j*40)})(i)}}' +
      'document.addEventListener("click",function(e){if(e.target.closest(".painting")||e.target.closest(".tp"))return;sp(e.clientX,e.clientY);setTimeout(function(){sp(e.clientX+(Math.random()-.5)*130,e.clientY+(Math.random()-.5)*130)},60)});' +
      'document.addEventListener("touchstart",function(e){if(e.target.closest(".painting")||e.target.closest(".tp"))return;var t=e.touches[0];sp(t.clientX,t.clientY)});' +
      'var dn=false,lt=0;document.addEventListener("mousedown",function(e){if(!e.target.closest(".painting"))dn=true});document.addEventListener("mouseup",function(){dn=false});' +
      'document.addEventListener("mousemove",function(e){if(dn&&Date.now()-lt>45){lt=Date.now();sp(e.clientX,e.clientY)}});' +
      'document.addEventListener("touchmove",function(e){if(e.target.closest(".painting"))return;if(Date.now()-lt>45){lt=Date.now();var t=e.touches[0];sp(t.clientX,t.clientY)}})' +
      '})();' +
      '(function(){var txt=' + typewriterTextJS + ';var msg=document.getElementById("finaleMsg");if(!msg||!txt)return;var sig=document.getElementById("finaleSig");msg.innerHTML="<span class=\\"type-cursor\\"></span>";var c=msg.querySelector(".type-cursor"),i=0;function step(){if(i>=txt.length){if(c)c.remove();if(sig)sig.style.opacity="1";return}var ch=txt.charAt(i);if(ch==="\\n"){c.insertAdjacentHTML("beforebegin","<br>")}else{c.insertAdjacentText("beforebegin",ch)}i++;var d=(ch==="."||ch===","||ch==="!")?75:(ch==="\\n"?110:22+Math.random()*16);setTimeout(step,d)}if(sig)sig.style.opacity=".25";setTimeout(step,320)})();' +
      '<\/script></body></html>';
  }

  function buildCardHTMLAsync(card) {
    if (!card || !card.theme) return Promise.resolve('');
    if (!isV2Theme(card.theme)) return Promise.resolve(buildCardHTML(card));
    var path = v2ThemeTemplates[card.theme];
    return loadV2Template(path).then(function(rawTemplate) {
      return patchV2Template(rawTemplate, card);
    });
  }

  global.LiveCardRender = {
    buildCardHTML: buildCardHTML,
    buildCardHTMLAsync: buildCardHTMLAsync,
    themes: themes,
    v2ThemeTemplates: v2ThemeTemplates
  };
})(typeof window !== 'undefined' ? window : this);
