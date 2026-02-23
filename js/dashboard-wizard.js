(function() {
  'use strict';

  var SUPABASE_URL = 'https://oajeeondcepecnwbxtcu.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hamVlb25kY2VwZWNud2J4dGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzMxMTEsImV4cCI6MjA4NzMwOTExMX0.4lBIzEWjFIoSC5f4Lxb1ZBIo0KEYt46XaTPen5xWH_U';
  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  var MAX_PHOTOS = 12;
  var CARD_PRICE = 19;
  var PREVIEW_DEBOUNCE_MS = 240;

  var STEP_ITEMS = [
    { id: 'occasion', label: 'Moment' },
    { id: 'photos', label: 'Photos' },
    { id: 'message', label: 'Message' },
    { id: 'style', label: 'Style' },
    { id: 'gift', label: 'Gift' },
    { id: 'preview', label: 'Preview' }
  ];

  var OCCASIONS = [
    { id: 'birthday', icon: '🎂', name: 'Birthday' },
    { id: 'wedding', icon: '💍', name: 'Wedding' },
    { id: 'anniversary', icon: '✨', name: 'Anniversary' },
    { id: 'baby', icon: '🍼', name: 'New Baby' },
    { id: 'graduation', icon: '🎓', name: 'Graduation' },
    { id: 'holiday', icon: '🎄', name: 'Holiday' },
    { id: 'thankyou', icon: '💛', name: 'Thank You' },
    { id: 'congrats', icon: '🎉', name: 'Congrats' },
    { id: 'getwell', icon: '🌿', name: 'Get Well' },
    { id: 'justbecause', icon: '💌', name: 'Just Because' }
  ];

  var DEFAULT_MESSAGES = {
    birthday: 'Happy birthday. I hope this year wraps you in wonder, warmth, and the kind of joy that lingers all season.',
    wedding: 'Your love story keeps becoming more beautiful with every chapter. Wishing you both a lifetime of softness and strength.',
    anniversary: 'Another year, another layer of love. Thank you for showing what commitment and joy can look like together.',
    baby: 'Welcome little one. You are deeply loved already, and your story is surrounded by people cheering you on.',
    graduation: 'You did it. Your hard work, courage, and growth are all over this moment. We are so proud of you.',
    holiday: 'Wishing you a season full of warmth, rest, and meaningful moments with the people who matter most.',
    thankyou: 'Thank you for your care, your generosity, and all the ways you show up. It means more than words can say.',
    congrats: 'Congratulations. You earned this. May this moment open the door to even bigger possibilities ahead.',
    getwell: 'Sending gentle thoughts and steady strength your way. One step at a time, and brighter days ahead.',
    justbecause: 'No special date needed. I just wanted you to know you matter to me and I am grateful for you.'
  };

  var MUSIC_OPTIONS = [
    { id: 'music_box_birthday', name: 'Music Box Birthday' },
    { id: 'ambient_warm', name: 'Warm Ambient Pads' },
    { id: 'gentle_piano', name: 'Gentle Piano' },
    { id: 'celestial_pads', name: 'Celestial Pads' },
    { id: 'soft_guitar', name: 'Soft Guitar' },
    { id: 'none', name: 'No Music' }
  ];

  var GIFT_BRANDS = ['Amazon', 'Sephora', 'Starbucks', 'DoorDash', 'Uber Eats', 'Target', 'Nike', 'Apple', 'Netflix', 'Visa'];
  var GIFT_AMOUNTS = [10, 25, 50, 75, 100, 'custom'];

  var THEME_OPTIONS = [
    { id: 'watercolor', name: 'Watercolor', swatches: ['#e8c4a0', '#c4b0d4', '#a0c8d8'] },
    { id: 'starlit', name: 'Starlit', swatches: ['#1b2540', '#8ba4c4', '#d4a853'] },
    { id: 'golden', name: 'Golden', swatches: ['#d4a853', '#e8c080', '#c47850'] },
    { id: 'blossom', name: 'Blossom', swatches: ['#f4b4c8', '#98c9a3', '#fcdce8'] },
    { id: 'aurora', name: 'Aurora Dreams', swatches: ['#78c8b4', '#60a8d0', '#0a0e1a'] },
    { id: 'constellation', name: 'Constellation', swatches: ['#0f172d', '#c9a96a', '#9cb1d5'] },
    { id: 'gardenbloom', name: 'Garden Bloom', swatches: ['#bcd9b4', '#e8d4c0', '#8fb89e'] },
    { id: 'gentletide', name: 'Gentle Tide', swatches: ['#8fbcc5', '#d0e8ec', '#6f949d'] },
    { id: 'goldenhour', name: 'Golden Hour', swatches: ['#efb86a', '#f7d7a6', '#c6844e'] },
    { id: 'iridescent', name: 'Iridescent', swatches: ['#7ad9cf', '#d4b3f2', '#f3d7a8'] },
    { id: 'lantern', name: 'Lantern Festival', swatches: ['#e8b464', '#d4944c', '#1a1420'] },
    { id: 'lotus', name: 'Lotus Ceremony', swatches: ['#e6b98d', '#f7e4cf', '#8f6a4a'] },
    { id: 'bioluminescence', name: 'Deep Bioluminescence', swatches: ['#5dd6b8', '#56b4de', '#0a1220'] },
    { id: 'midnightrain', name: 'Midnight Rain', swatches: ['#5d6f9b', '#9ab3d6', '#1a2238'] },
    { id: 'paperboats', name: 'Paper Boats', swatches: ['#b0a0c8', '#d8d1e8', '#7f7296'] },
    { id: 'petaldrift', name: 'Petal Drift', swatches: ['#d48ea7', '#f3d1dd', '#9d6a7d'] },
    { id: 'risingembers', name: 'Rising Embers', swatches: ['#f0a030', '#ffd08f', '#8f3f18'] },
    { id: 'sakura', name: 'Sakura Wind', swatches: ['#f3c0cc', '#fce3ea', '#b98fa4'] },
    { id: 'firefly', name: 'Firefly Meadow', swatches: ['#b8c888', '#f3e6a8', '#4b5f36'] },
    { id: 'wishbottles', name: 'Wish Bottles', swatches: ['#80d0e8', '#d6f1f8', '#4f7f95'] },
    { id: 'dandelions', name: 'Wishing Dandelions', swatches: ['#e8d4a0', '#f7eccc', '#9f8a52'] }
  ];

  var currentUser = null;
  var currentStep = 1;
  var previewHTML = '';
  var previewTimer = null;

  var state = {
    currentCardId: null,
    occasion: 'birthday',
    recipientName: '',
    cardTitle: '',
    senderName: '',
    photos: [],
    message: DEFAULT_MESSAGES.birthday,
    sectionMessages: [],
    theme: 'watercolor',
    musicStyle: 'music_box_birthday',
    features: {
      photoInteractions: true,
      brushReveal: true,
      paintCanvas: true,
      confettiFinale: true
    },
    giftEnabled: false,
    giftBrand: GIFT_BRANDS[0],
    giftAmount: 25
  };

  boot();

  async function boot() {
    try {
      await ensureSession();
      bindStaticUI();
      renderStepTrack();
      renderOccasionGrid();
      renderThemeGrid();
      renderMusicGrid();
      renderGiftUI();
      seedFormFromState();
      renderSectionMessages();
      renderPhotoList();
      await loadCards();
      updateStepUI();
      schedulePreview();
    } catch (err) {
      showToast('Could not load dashboard.', true);
      console.error(err);
    }
  }

  async function ensureSession() {
    var result = await sb.auth.getSession();
    var session = result && result.data ? result.data.session : null;
    if (!session) {
      window.location.href = '/login.html';
      throw new Error('Not authenticated');
    }
    currentUser = session.user;
    var emailEl = document.getElementById('userEmail');
    if (emailEl) emailEl.textContent = currentUser.email || '';
  }

  function bindStaticUI() {
    document.getElementById('signOutBtn').addEventListener('click', async function() {
      await sb.auth.signOut();
      window.location.href = '/login.html';
    });

    document.getElementById('btnBack').addEventListener('click', function() {
      if (currentStep > 1) {
        currentStep -= 1;
        updateStepUI();
      }
    });

    document.getElementById('btnNext').addEventListener('click', function() {
      if (!validateStep(currentStep)) return;
      if (currentStep < STEP_ITEMS.length) {
        currentStep += 1;
        updateStepUI();
      }
    });

    document.getElementById('btnSaveDraft').addEventListener('click', async function() {
      await persistCard();
      showToast('Draft saved.');
    });

    document.getElementById('btnCopyLink').addEventListener('click', copyShareLink);
    document.getElementById('btnComplete').addEventListener('click', async function() {
      await persistCard();
      await copyShareLink();
      showToast('Saved and share link copied. Checkout flow is next.');
    });

    document.getElementById('btnDownload').addEventListener('click', downloadHTML);
    document.getElementById('btnOpenPreview').addEventListener('click', openFullPreview);
    document.getElementById('aiSuggestBtn').addEventListener('click', function() {
      showToast('AI writer placeholder - not wired yet.');
    });

    bindTextInputs();
    bindPhotoUploader();
    bindFeatureToggles();
    bindGiftInputs();
  }

  function bindTextInputs() {
    document.getElementById('recipientName').addEventListener('input', function(e) { state.recipientName = e.target.value; schedulePreview(); renderSummary(); });
    document.getElementById('cardTitle').addEventListener('input', function(e) { state.cardTitle = e.target.value; schedulePreview(); renderSummary(); });
    document.getElementById('senderName').addEventListener('input', function(e) { state.senderName = e.target.value; schedulePreview(); renderSummary(); });
    document.getElementById('messageText').addEventListener('input', function(e) { state.message = e.target.value; schedulePreview(); renderSummary(); });
  }

  function bindPhotoUploader() {
    var dropzone = document.getElementById('dropzone');
    var fileInput = document.getElementById('fileInput');
    dropzone.addEventListener('click', function() { fileInput.click(); });
    dropzone.addEventListener('dragover', function(e) { e.preventDefault(); dropzone.classList.add('drag'); });
    dropzone.addEventListener('dragleave', function() { dropzone.classList.remove('drag'); });
    dropzone.addEventListener('drop', function(e) { e.preventDefault(); dropzone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', function() { handleFiles(fileInput.files); fileInput.value = ''; });
  }

  function bindFeatureToggles() {
    document.getElementById('featPhoto').addEventListener('change', function(e) { state.features.photoInteractions = e.target.checked; schedulePreview(); });
    document.getElementById('featBrush').addEventListener('change', function(e) { state.features.brushReveal = e.target.checked; schedulePreview(); });
    document.getElementById('featPaint').addEventListener('change', function(e) { state.features.paintCanvas = e.target.checked; schedulePreview(); });
    document.getElementById('featConfetti').addEventListener('change', function(e) { state.features.confettiFinale = e.target.checked; schedulePreview(); });
  }

  function bindGiftInputs() {
    document.getElementById('giftEnabled').addEventListener('change', function(e) { state.giftEnabled = e.target.checked; renderSummary(); schedulePreview(); });
    document.getElementById('giftBrand').addEventListener('change', function(e) { state.giftBrand = e.target.value; renderSummary(); schedulePreview(); });
    document.getElementById('giftCustom').addEventListener('input', function(e) {
      var v = parseInt(e.target.value, 10);
      if (!isNaN(v) && v > 0) state.giftAmount = v;
      renderSummary();
      schedulePreview();
    });
  }

  function seedFormFromState() {
    document.getElementById('recipientName').value = state.recipientName;
    document.getElementById('cardTitle').value = state.cardTitle;
    document.getElementById('senderName').value = state.senderName;
    document.getElementById('messageText').value = state.message;
    document.getElementById('giftEnabled').checked = state.giftEnabled;
    document.getElementById('giftBrand').value = state.giftBrand;
  }

  function renderStepTrack() {
    var track = document.getElementById('stepTrack');
    track.innerHTML = '';
    STEP_ITEMS.forEach(function(step, idx) {
      var chip = document.createElement('div');
      chip.className = 'step-chip';
      chip.textContent = (idx + 1) + '. ' + step.label;
      chip.dataset.step = String(idx + 1);
      chip.addEventListener('click', function() {
        var target = parseInt(chip.dataset.step, 10);
        if (target <= currentStep || validateStep(currentStep)) {
          currentStep = target;
          updateStepUI();
        }
      });
      track.appendChild(chip);
    });
  }

  function renderOccasionGrid() {
    var grid = document.getElementById('occasionGrid');
    grid.innerHTML = '';
    OCCASIONS.forEach(function(o) {
      var div = document.createElement('div');
      div.className = 'occasion' + (o.id === state.occasion ? ' active' : '');
      div.dataset.id = o.id;
      div.innerHTML = '<b>' + o.icon + '</b><span>' + o.name + '</span>';
      div.addEventListener('click', function() {
        state.occasion = o.id;
        if (!state.message || state.message === DEFAULT_MESSAGES[state.occasion]) state.message = DEFAULT_MESSAGES[o.id] || '';
        document.getElementById('messageText').value = state.message;
        renderOccasionGrid();
        renderSummary();
        schedulePreview();
      });
      grid.appendChild(div);
    });
  }

  function renderThemeGrid() {
    var grid = document.getElementById('themeGrid');
    grid.innerHTML = '';
    THEME_OPTIONS.forEach(function(t) {
      var card = document.createElement('div');
      card.className = 'theme-card' + (t.id === state.theme ? ' active' : '');
      card.innerHTML = '<div class="swatches">' + t.swatches.map(function(c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</div><div>' + t.name + '</div>';
      card.addEventListener('click', function() {
        state.theme = t.id;
        renderThemeGrid();
        renderSummary();
        schedulePreview();
      });
      grid.appendChild(card);
    });
  }

  function renderMusicGrid() {
    var grid = document.getElementById('musicGrid');
    grid.innerHTML = '';
    MUSIC_OPTIONS.forEach(function(m) {
      var card = document.createElement('div');
      card.className = 'music-card' + (m.id === state.musicStyle ? ' active' : '');
      card.textContent = m.name;
      card.addEventListener('click', function() {
        state.musicStyle = m.id;
        renderMusicGrid();
        renderSummary();
        schedulePreview();
      });
      grid.appendChild(card);
    });
  }

  function renderGiftUI() {
    var brand = document.getElementById('giftBrand');
    brand.innerHTML = GIFT_BRANDS.map(function(b) { return '<option value="' + b + '">' + b + '</option>'; }).join('');
    brand.value = state.giftBrand;

    var amounts = document.getElementById('giftAmounts');
    amounts.innerHTML = '';
    GIFT_AMOUNTS.forEach(function(v) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = v === 'custom' ? 'Custom' : ('$' + v);
      btn.className = (state.giftAmount === v ? 'active' : '');
      btn.addEventListener('click', function() {
        if (v === 'custom') {
          document.getElementById('giftCustom').style.display = 'block';
          document.getElementById('giftCustom').focus();
        } else {
          document.getElementById('giftCustom').style.display = 'none';
          state.giftAmount = v;
          renderGiftUI();
          renderSummary();
          schedulePreview();
        }
      });
      amounts.appendChild(btn);
    });
  }

  async function handleFiles(fileList) {
    var files = Array.from(fileList || []);
    if (!files.length) return;
    for (var i = 0; i < files.length; i++) {
      if (state.photos.length >= MAX_PHOTOS) break;
      var file = files[i];
      if (!file.type || file.type.indexOf('image') !== 0) continue;
      try {
        var dataUrl = await resizeImage(file, 900, 0.84);
        state.photos.push({ dataUrl: dataUrl, caption: '', name: file.name || 'photo' });
      } catch (err) {
        console.error(err);
      }
    }
    renderPhotoList();
    renderSectionMessages();
    renderSummary();
    schedulePreview();
  }

  function resizeImage(file, maxSize, quality) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
          var w = img.width;
          var h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) { h = h * (maxSize / w); w = maxSize; }
            else { w = w * (maxSize / h); h = maxSize; }
          }
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(w);
          canvas.height = Math.round(h);
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function renderPhotoList() {
    var list = document.getElementById('photoList');
    list.innerHTML = '';
    state.photos.forEach(function(photo, idx) {
      var card = document.createElement('div');
      card.className = 'photo-item';
      card.innerHTML = '<img src="' + photo.dataUrl + '" alt="photo"><div class="field"><label>Caption</label><input value="' + (photo.caption || '') + '" data-caption="' + idx + '"></div><div class="photo-actions"><button type="button" data-up="' + idx + '">↑</button><button type="button" data-down="' + idx + '">↓</button><button type="button" data-del="' + idx + '">Remove</button></div>';
      list.appendChild(card);
    });
    list.querySelectorAll('input[data-caption]').forEach(function(input) {
      input.addEventListener('input', function() {
        var idx = parseInt(input.getAttribute('data-caption'), 10);
        if (state.photos[idx]) state.photos[idx].caption = input.value;
        schedulePreview();
      });
    });
    list.querySelectorAll('button[data-up]').forEach(function(btn) {
      btn.addEventListener('click', function() { movePhoto(parseInt(btn.getAttribute('data-up'), 10), -1); });
    });
    list.querySelectorAll('button[data-down]').forEach(function(btn) {
      btn.addEventListener('click', function() { movePhoto(parseInt(btn.getAttribute('data-down'), 10), 1); });
    });
    list.querySelectorAll('button[data-del]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.photos.splice(parseInt(btn.getAttribute('data-del'), 10), 1);
        renderPhotoList();
        renderSectionMessages();
        renderSummary();
        schedulePreview();
      });
    });
  }

  function movePhoto(index, delta) {
    var target = index + delta;
    if (target < 0 || target >= state.photos.length) return;
    var temp = state.photos[index];
    state.photos[index] = state.photos[target];
    state.photos[target] = temp;
    renderPhotoList();
    renderSectionMessages();
    schedulePreview();
  }

  function renderSectionMessages() {
    var wrap = document.getElementById('sectionMessages');
    var sectionCount = Math.max(1, Math.ceil(state.photos.length / 2));
    while (state.sectionMessages.length < sectionCount) state.sectionMessages.push('');
    state.sectionMessages = state.sectionMessages.slice(0, sectionCount);
    wrap.innerHTML = '';
    for (var i = 0; i < sectionCount; i++) {
      var field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = '<input placeholder="Section ' + (i + 1) + ' message (optional)" value="' + (state.sectionMessages[i] || '') + '" data-sec="' + i + '">';
      wrap.appendChild(field);
    }
    wrap.querySelectorAll('input[data-sec]').forEach(function(input) {
      input.addEventListener('input', function() {
        var idx = parseInt(input.getAttribute('data-sec'), 10);
        state.sectionMessages[idx] = input.value;
        schedulePreview();
      });
    });
  }

  function updateStepUI() {
    document.querySelectorAll('.panel').forEach(function(panel) {
      var step = parseInt(panel.getAttribute('data-step'), 10);
      panel.classList.toggle('active', step === currentStep);
    });
    document.querySelectorAll('.step-chip').forEach(function(chip) {
      var step = parseInt(chip.dataset.step, 10);
      chip.classList.toggle('active', step === currentStep);
    });
    var fill = ((currentStep - 1) / (STEP_ITEMS.length - 1)) * 100;
    document.getElementById('progressFill').style.width = fill + '%';
    document.getElementById('btnBack').style.visibility = currentStep === 1 ? 'hidden' : 'visible';
    document.getElementById('btnNext').style.visibility = currentStep === STEP_ITEMS.length ? 'hidden' : 'visible';
    renderSummary();
    if (currentStep >= 3) schedulePreview();
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.occasion) return showToast('Choose an occasion.', true), false;
      if (!state.recipientName.trim()) return showToast('Enter recipient name.', true), false;
    }
    if (step === 2 && state.photos.length < 1) {
      showToast('Add at least one photo.', true);
      return false;
    }
    if (step === 3 && (!state.message || state.message.trim().length < 10)) {
      showToast('Write a longer message.', true);
      return false;
    }
    return true;
  }

  function buildMessagePayload() {
    return JSON.stringify({
      title: state.cardTitle || '',
      text: state.message || '',
      sectionMessages: state.sectionMessages.slice(),
      musicStyle: state.musicStyle,
      features: state.features,
      gift: state.giftEnabled ? { enabled: true, brand: state.giftBrand, amount: state.giftAmount, redemptionUrl: '' } : null
    });
  }

  function buildRenderCard() {
    return {
      occasion: state.occasion || 'birthday',
      recipient_name: state.recipientName || 'Someone Special',
      sender_name: state.senderName || 'With love',
      message: buildMessagePayload(),
      theme: state.theme || 'watercolor',
      photos: JSON.stringify(state.photos.map(function(p) {
        return { dataUrl: p.dataUrl, caption: p.caption || '', name: p.name || '' };
      }))
    };
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, PREVIEW_DEBOUNCE_MS);
  }

  async function refreshPreview() {
    var frame = document.getElementById('previewFrame');
    if (!window.LiveCardRender) {
      frame.innerHTML = '<div style="padding:18px;color:var(--danger)">Renderer unavailable.</div>';
      return;
    }
    try {
      var card = buildRenderCard();
      var html = window.LiveCardRender.buildCardHTMLAsync
        ? await window.LiveCardRender.buildCardHTMLAsync(card)
        : window.LiveCardRender.buildCardHTML(card);
      previewHTML = html || '';
      if (!previewHTML) {
        frame.innerHTML = '<div style="padding:18px;color:var(--danger)">Preview unavailable for this theme.</div>';
        return;
      }
      frame.innerHTML = '<iframe sandbox="allow-scripts allow-popups allow-downloads" allow="autoplay" title="Card preview"></iframe>';
      frame.querySelector('iframe').srcdoc = previewHTML;
    } catch (err) {
      console.error(err);
      frame.innerHTML = '<div style="padding:18px;color:var(--danger)">Could not render preview.</div>';
    }
  }

  function renderSummary() {
    var total = CARD_PRICE + (state.giftEnabled ? (Number(state.giftAmount) || 0) : 0);
    var html = ''
      + '<div class="summary-row"><span>Occasion</span><span>' + (state.occasion || '-') + '</span></div>'
      + '<div class="summary-row"><span>Recipient</span><span>' + (state.recipientName || '-') + '</span></div>'
      + '<div class="summary-row"><span>Theme</span><span>' + (state.theme || '-') + '</span></div>'
      + '<div class="summary-row"><span>Photos</span><span>' + state.photos.length + '</span></div>'
      + '<div class="summary-row"><span>Music</span><span>' + state.musicStyle.replace(/_/g, ' ') + '</span></div>'
      + '<div class="summary-row"><span>Card</span><span>$' + CARD_PRICE.toFixed(2) + '</span></div>'
      + (state.giftEnabled ? '<div class="summary-row"><span>Gift (' + state.giftBrand + ')</span><span>$' + (Number(state.giftAmount) || 0).toFixed(2) + '</span></div>' : '')
      + '<div class="summary-row total"><span>Total</span><span>$' + total.toFixed(2) + '</span></div>';
    document.getElementById('summaryBox').innerHTML = html;
  }

  async function persistCard() {
    if (!currentUser) throw new Error('No user');
    var payload = {
      user_id: currentUser.id,
      occasion: state.occasion || 'birthday',
      recipient_name: state.recipientName || 'Someone Special',
      sender_name: state.senderName || 'With love',
      message: buildMessagePayload(),
      theme: state.theme || 'watercolor',
      photos: JSON.stringify(state.photos.map(function(p) { return { dataUrl: p.dataUrl, caption: p.caption || '', name: p.name || '' }; }))
    };

    if (state.currentCardId) {
      var updateRes = await sb.from('cards').update(payload).eq('id', state.currentCardId).eq('user_id', currentUser.id);
      if (updateRes.error) throw updateRes.error;
    } else {
      var insertRes = await sb.from('cards').insert(payload).select('id').single();
      if (insertRes.error) throw insertRes.error;
      state.currentCardId = insertRes.data.id;
    }
    await loadCards();
  }

  async function copyShareLink() {
    await persistCard();
    var shareUrl = window.location.origin + '/c/' + state.currentCardId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied.');
    } else {
      showToast(shareUrl);
    }
  }

  function downloadHTML() {
    if (!previewHTML) return showToast('Preview not ready.', true);
    var blob = new Blob([previewHTML], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'livecard-' + (state.recipientName || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded.');
  }

  function openFullPreview() {
    if (!previewHTML) return showToast('Preview not ready.', true);
    var w = window.open('', '_blank');
    if (!w) return showToast('Popup blocked.', true);
    w.document.open();
    w.document.write(previewHTML);
    w.document.close();
  }

  async function loadCards() {
    if (!currentUser) return;
    var res = await sb.from('cards').select('id,recipient_name,occasion,theme').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    var shelf = document.getElementById('myCardsSection');
    var grid = document.getElementById('shelfGrid');
    var count = document.getElementById('cardCount');
    if (res.error || !res.data || !res.data.length) {
      shelf.style.display = 'none';
      return;
    }
    shelf.style.display = 'block';
    count.textContent = res.data.length + ' card' + (res.data.length === 1 ? '' : 's');
    grid.innerHTML = '';
    res.data.forEach(function(card) {
      var div = document.createElement('div');
      div.className = 'card-chip';
      div.innerHTML = '<div class="card-chip-title">' + escapeHtml(card.recipient_name || 'Someone') + '</div><div class="card-chip-sub">' + escapeHtml(card.occasion || '') + ' · ' + escapeHtml(card.theme || '') + '</div><div class="card-chip-actions"><a href="/c/' + card.id + '" target="_blank">View</a><button type="button" data-copy="' + card.id + '">Copy Link</button><button type="button" data-delete="' + card.id + '">Delete</button></div>';
      grid.appendChild(div);
    });
    grid.querySelectorAll('button[data-copy]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var url = window.location.origin + '/c/' + btn.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url);
        showToast('Link copied.');
      });
    });
    grid.querySelectorAll('button[data-delete]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        if (!confirm('Delete this card?')) return;
        var id = btn.getAttribute('data-delete');
        await sb.from('cards').delete().eq('id', id).eq('user_id', currentUser.id);
        if (id === state.currentCardId) state.currentCardId = null;
        await loadCards();
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showToast(msg, isError) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = isError ? 'var(--danger)' : '#3a2f2a';
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2200);
  }
})();
