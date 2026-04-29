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

    const audioBtn = document.createElement('button');
    audioBtn.className = 'col-span-full p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 hover:border-emerald-500 group shadow-sm hover:shadow-lg transition-all text-left w-full mb-2';
    audioBtn.onclick = () => downloadMuxed('1080', 'audio_only');
    audioBtn.innerHTML = `
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-2">
            <span class="text-slate-200 font-bold group-hover:text-white transition-colors">Extrage Doar Audio</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">MP3</span>
          </div>
          <div class="text-xs text-emerald-400 font-mono flex items-center gap-2">
             <span class="material-icons text-[12px] w-[12px] h-[12px] leading-none">music_note</span>
             Fișier Audio (.mp3)
          </div>
        </div>
        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all overflow-hidden flex-shrink-0">
          <span class="material-icons text-[20px]">download</span>
        </div>
    `;
    formatsGrid.appendChild(audioBtn);

    resolutions.forEach(res => {
      const isHighRes = res >= 1440;
      const resContainer = document.createElement('div');
      resContainer.className = 'p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col gap-3 group shadow-sm text-left w-full hover:border-slate-700 transition-colors border-t-2 ' + (isHighRes ? 'border-t-rose-500' : 'border-t-sky-500');

      const header = document.createElement('div');
      header.className = 'flex items-center gap-2';
      header.innerHTML = `
            <span class="text-slate-200 font-bold">${res}p</span>
            ${isHighRes ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">4K/MAX</span>` : ''}
      `;
      resContainer.appendChild(header);

      const btnGrid = document.createElement('div');
      btnGrid.className = 'grid grid-cols-2 gap-2';

      const btnVA = document.createElement('button');
      btnVA.className = 'flex items-center justify-center gap-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors';
      btnVA.innerHTML = `<span class="material-icons text-[14px]">stars</span> Vid+Aud (.mp4)`;
      btnVA.onclick = () => downloadMuxed(res, 'video_audio');

      const btnV = document.createElement('button');
      btnV.className = 'flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors border border-slate-700';
      btnV.innerHTML = `<span class="material-icons text-[14px]">videocam</span> Doar Video`;
      btnV.onclick = () => downloadMuxed(res, 'video_only');

      btnGrid.appendChild(btnVA);
      btnGrid.appendChild(btnV);
      resContainer.appendChild(btnGrid);

      formatsGrid.appendChild(resContainer);
    });

    videoInfoContainer.classList.remove('hidden');
  };

  const downloadMuxed = async (height, type = 'video_audio') => {
    setLoading(true);

    let typeText = 'Procesare...';
    if (type === 'audio_only') typeText = 'Pregătire Audio MP3...';
    else if (type === 'video_only') typeText = `Pregătire Video ${height}p...`;
    else typeText = `Pregătire Video+Audio ${height}p...`;

    searchBtnText.textContent = typeText;
    
    try {
      const response = await fetch(`./api/prepare?url=${encodeURIComponent(currentUrl)}&height=${height}&type=${type}`);
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
                  searchBtnText.textContent = `Procesare... (${type === 'audio_only' ? 'MP3' : height + 'p'})`;
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
