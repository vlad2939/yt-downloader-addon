document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchBtnText = document.getElementById('searchBtnText');
  const searchBtnIcon = document.getElementById('searchBtnIcon');
  
  const errorContainer = document.getElementById('errorContainer');
  const errorText = document.getElementById('errorText');
  
  const videoInfoContainer = document.getElementById('videoInfoContainer');
  const videoThumb = document.getElementById('videoThumb');
  const videoTitle = document.getElementById('videoTitle');
  const formatsGrid = document.getElementById('formatsGrid');

  let isLoading = false;
  let currentUrl = '';

  const setLoading = (loading) => {
    isLoading = loading;
    if (loading) {
      searchBtn.disabled = true;
      urlInput.disabled = true;
      searchBtnText.textContent = 'Procesare...';
      searchBtnIcon.classList.remove('hidden');
    } else {
      searchBtn.disabled = false;
      urlInput.disabled = false;
      searchBtnText.textContent = 'Caută';
      searchBtnIcon.classList.add('hidden');
    }
  };

  const showError = (msg) => {
    errorContainer.classList.remove('hidden');
    errorContainer.classList.add('flex');
    errorText.textContent = msg;
    videoInfoContainer.classList.add('hidden');
  };

  const hideError = () => {
    errorContainer.classList.add('hidden');
    errorContainer.classList.remove('flex');
  };

  const fetchInfo = async () => {
    const url = urlInput.value.trim();
    if (!url) {
      showError('Te rog introdu un link de YouTube valid.');
      return;
    }

    currentUrl = url;
    setLoading(true);
    hideError();
    videoInfoContainer.classList.add('hidden');

    try {
      const response = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nu am putut prelua informațiile videoclipului.');
      }

      renderVideoInfo(data);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Eroare la conectarea cu serverul.');
    } finally {
      setLoading(false);
    }
  };

  const renderVideoInfo = (info) => {
    videoThumb.src = info.thumbnail;
    videoTitle.textContent = info.title;

    // Sort matching Angular logic
    let formats = info.formats;
    formats.sort((a, b) => {
      const resA = parseInt(a.qualityLabel || '0');
      const resB = parseInt(b.qualityLabel || '0');
      if (resA !== resB) return resB - resA;
      if (a.hasAudio && !b.hasAudio) return -1;
      if (!a.hasAudio && b.hasAudio) return 1;
      return 0;
    });

    const uniqueFormats = [];
    const seen = new Set();
    for (const f of formats) {
      const key = `${f.qualityLabel}-${f.hasAudio}`;
      if (!seen.has(key) && f.qualityLabel) {
        seen.add(key);
        uniqueFormats.push(f);
      }
    }

    formatsGrid.innerHTML = '';

    uniqueFormats.forEach(format => {
      const isHighRes = format.qualityLabel.includes('2160p') || format.qualityLabel.includes('1440p');
      
      const btn = document.createElement('button');
      btn.className = 'p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 hover:border-rose-500 group shadow-sm hover:shadow-lg transition-all text-left w-full';
      btn.onclick = () => download(format.itag);

      let audioStatusHTML = '';
      if (!format.hasAudio) {
        audioStatusHTML = `<span class="text-slate-400 flex items-center gap-1"><span class="material-icons text-[12px] w-[12px] h-[12px] leading-none">volume_off</span> Fără audio</span>`;
      } else {
        audioStatusHTML = `<span class="text-rose-400 flex items-center gap-1"><span class="material-icons text-[12px] w-[12px] h-[12px] leading-none">volume_up</span> Audio</span>`;
      }

      btn.innerHTML = `
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-2">
            <span class="text-slate-200 font-bold group-hover:text-white transition-colors">${format.qualityLabel}</span>
            ${isHighRes ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">4K/2K</span>` : ''}
          </div>
          <div class="text-xs text-slate-500 font-mono flex items-center gap-2">
            <span class="uppercase">${format.container}</span> • 
            ${audioStatusHTML}
          </div>
        </div>
        <div class="w-8 h-8 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
          <span class="material-icons text-[18px]">download</span>
        </div>
      `;

      formatsGrid.appendChild(btn);
    });

    videoInfoContainer.classList.remove('hidden');
  };

  const download = (itag) => {
    const downloadUrl = `/api/download?url=${encodeURIComponent(currentUrl)}&itag=${itag}`;
    window.location.href = downloadUrl;
  };

  searchBtn.addEventListener('click', fetchInfo);
  urlInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      fetchInfo();
    }
  });
});
