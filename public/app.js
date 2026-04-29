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
      const response = await fetch(`./api/info?url=${encodeURIComponent(url)}`);
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

    const resolutions = info.resolutions || [];
    formatsGrid.innerHTML = '';

    resolutions.forEach(res => {
      const isHighRes = res >= 1440;
      const btn = document.createElement('button');
      btn.className = 'p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 hover:border-rose-500 group shadow-sm hover:shadow-lg transition-all text-left w-full';
      btn.onclick = () => downloadMuxed(res);

      btn.innerHTML = `
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-2">
            <span class="text-slate-200 font-bold group-hover:text-white transition-colors">${res}p</span>
            ${isHighRes ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">4K/MAX</span>` : ''}
          </div>
          <div class="text-xs text-rose-400 font-mono flex items-center gap-2">
             <span class="material-icons text-[12px] w-[12px] h-[12px] leading-none">stars</span>
             Video + Audio MP4
          </div>
        </div>
        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all overflow-hidden flex-shrink-0">
          <span class="material-icons text-[20px]">download</span>
        </div>
      `;
      formatsGrid.appendChild(btn);
    });

    videoInfoContainer.classList.remove('hidden');
  };

  const downloadMuxed = async (height) => {
    setLoading(true);
    searchBtnText.textContent = `Pregătire pe server...`;
    
    try {
      const response = await fetch(`./api/prepare?url=${encodeURIComponent(currentUrl)}&height=${height}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Eroare la inițierea descărcării.');
      }
      
      const fileId = data.id;
      
      const checkStatus = async () => {
          try {
              const statusRes = await fetch(`./api/status?id=${fileId}`);
              const statusData = await statusRes.json();
              
              if (statusData.status === 'processing') {
                  searchBtnText.textContent = `Procesare/Muxare (${height}p)...`;
                  setTimeout(checkStatus, 3000); // Polling la 3 secunde
              } else if (statusData.status === 'done') {
                  searchBtnText.textContent = 'Transfer browser...';
                  window.location.href = `./api/file?id=${fileId}&filename=${encodeURIComponent(statusData.filename)}`;
                  
                  setTimeout(() => {
                      setLoading(false);
                      searchBtnText.textContent = 'Caută';
                  }, 3000);
              } else if (statusData.status === 'error') {
                  throw new Error(statusData.error || 'Eroare la procesarea internă.');
              }
          } catch (err) {
              console.error(err);
              showError(err.message);
              setLoading(false);
              searchBtnText.textContent = 'Caută';
          }
      };
      
      // Pornim polling-ul
      setTimeout(checkStatus, 3000);
      
    } catch (err) {
      console.error(err);
      showError(err.message);
      setLoading(false);
      searchBtnText.textContent = 'Caută';
    }
  };

  searchBtn.addEventListener('click', fetchInfo);
  urlInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      fetchInfo();
    }
  });
});
