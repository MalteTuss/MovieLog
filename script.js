const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

let currentPage = 1;
let currentQuery = "";
let debounceTimer;
let currentView = "search";

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const addCustomBtn = document.getElementById("addCustomBtn");

// --- NAVIGATION HELPERS ---

function setActiveTab(clickedButton) {
  document.querySelectorAll('.nav-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
  clickedButton.classList.add('active');
}

function goHome(button) {
  setActiveTab(button);
  currentView = "search";
  searchInput.value = "";
  searchInput.placeholder = "Search new movies...";
  addCustomBtn.style.display = "none";
  resultsContainer.innerHTML = "";
  loadMoreBtn.style.display = "none";
}

// --- EVENT LISTENERS ---

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (currentView === "search") {
      if (query.length >= 2) {
        currentQuery = query;
        currentPage = 1;
        fetchMovies(true);
      } else if (query.length === 0) {
        resultsContainer.innerHTML = "";
        loadMoreBtn.style.display = "none";
      }
    } else {
      filterLocalList(query);
    }
  }, 400);
});

// --- MODAL LOGIK (CUSTOM MOVIE) ---

function openCustomModal() {
  document.getElementById("customMovieModal").style.display = "block";
}

function closeCustomModal() {
  document.getElementById("customMovieModal").style.display = "none";
  document.getElementById("customMovieForm").reset();
}

document.getElementById("customMovieForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const movie = {
    id: "custom-" + Date.now(),
    title: document.getElementById("customTitle").value,
    release_date: document.getElementById("customYear").value || "????",
    poster_path: document.getElementById("customPoster").value || "",
    vote_average: 0,
    isCustom: true,
    overview: "Custom added movie."
  };
  saveCustomMovie(movie);
  closeCustomModal();
  showMyList(currentView, document.querySelector(`.nav-buttons button.active`));
});

function saveCustomMovie(movie) {
  let list = JSON.parse(localStorage.getItem(currentView)) || [];
  list.unshift(movie);
  localStorage.setItem(currentView, JSON.stringify(list));
}

// --- MODAL LOGIK (DETAILS) ---

async function showMovieDetails(movieId, isCustom) {
  const modal = document.getElementById("movieDetailsModal");
  const content = document.getElementById("movieDetailsContent");
  content.innerHTML = "<p style='text-align:center;'>Loading details...</p>";
  modal.style.display = "block";

  if (isCustom) {
    // Om det är en egenskapad film, hämta från localStorage
    const allMovies = JSON.parse(localStorage.getItem(currentView)) || [];
    const movie = allMovies.find(m => m.id === movieId);
    renderDetails(movie);
  } else {
    // Annars hämta från TMDB API (inklusive skådespelare via append_to_response)
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
      const movie = await res.json();
      renderDetails(movie);
    } catch (err) {
      content.innerHTML = "<p>Could not load details.</p>";
    }
  }
}

function renderDetails(movie) {
  const content = document.getElementById("movieDetailsContent");
  const poster = movie.isCustom ? 
    (movie.poster_path || "https://dummyimage.com/300x450/1a1a1a/666666&text=No+Image") :
    `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "N/A";
  const cast = movie.credits ? movie.credits.cast.slice(0, 5).map(c => c.name).join(", ") : "N/A";

  content.innerHTML = `
    <div class="detail-container">
      <img src="${poster}" alt="${movie.title}">
      <div class="detail-info">
        <h2>${movie.title} (${movie.release_date ? movie.release_date.split("-")[0] : '????'})</h2>
        <p><strong>Rating:</strong> ★ ${movie.vote_average ? movie.vote_average.toFixed(1) : '?'}</p>
        <p><strong>Genres:</strong> ${genres}</p>
        <p><strong>Cast:</strong> ${cast}</p>
        <p class="overview"><strong>Overview:</strong><br>${movie.overview || "No description available."}</p>
      </div>
    </div>
  `;
}

function closeDetailModal() {
  document.getElementById("movieDetailsModal").style.display = "none";
}

// --- API FUNCTIONS ---

async function fetchMovies(isNewSearch = false) {
  try {
    if (isNewSearch) {
      resultsContainer.innerHTML = "";
      currentPage = 1;
    }
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
      const filtered = data.results.filter(m => m.poster_path);
      displayMovies(filtered);
      loadMoreBtn.style.display = data.total_pages > currentPage ? "block" : "none";
    }
  } catch (error) { console.error(error); }
}

function loadMore() {
  currentPage++;
  fetchMovies(false);
}

// --- LOCAL FILTER FUNCTION ---

function filterLocalList(query) {
  const savedMovies = JSON.parse(localStorage.getItem(currentView)) || [];
  const filtered = savedMovies.filter(movie => movie.title.toLowerCase().includes(query));
  resultsContainer.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: white; text-transform: capitalize; margin-bottom: 20px;">My ${currentView}</h2>`;
  displayMovies(filtered);
}

// --- DISPLAY FUNCTIONS ---

function displayMovies(movies) {
  const isInList = (movieId, listName) => {
    const list = JSON.parse(localStorage.getItem(listName)) || [];
    return list.some(m => m.id === movieId);
  };

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");
    // Gör hela kortet klickbart men bara bilden triggar detaljer för att inte krocka med knappar
    card.onclick = () => showMovieDetails(movie.id, movie.isCustom);

    const poster = movie.isCustom ? 
      (movie.poster_path || "https://dummyimage.com/300x450/1a1a1a/666666&text=No+Image") :
      `https://image.tmdb.org/t/p/w342${movie.poster_path}`;

    const year = movie.release_date ? movie.release_date.split("-")[0] : "????";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "?";

    const watchedClass = isInList(movie.id, "watched") ? "active" : "";
    const watchlistClass = isInList(movie.id, "watchlist") ? "active" : "";
    const favClass = isInList(movie.id, "favorites") ? "active" : "";

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" loading="lazy">
      <div class="movie-info">
        <h3>${movie.title} ${movie.isCustom ? '<small style="color: #e50914;">(Custom)</small>' : ''}</h3>
        <div class="year">${year} • <span class="rating">★ ${rating}</span></div>
        <div class="actions">
          <button class="btn-save ${watchedClass}" data-type="watched">✅ Watched</button>
          <button class="btn-save ${watchlistClass}" data-type="watchlist">⏳ Watchlist</button>
          <button class="btn-save ${favClass}" data-type="favorites">❤️ Favorite</button>
        </div>
      </div>
    `;

    // Förhindra att detalj-modalen öppnas när man klickar på spara-knapparna
    card.querySelectorAll(".btn-save").forEach(button => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const listType = button.getAttribute("data-type");
        toggleMovieInList(movie, listType, button, card);
      });
    });

    resultsContainer.appendChild(card);
  });
}

// --- SAVE LOGIC ---

function toggleMovieInList(movie, listName, button, card) {
  let list = JSON.parse(localStorage.getItem(listName)) || [];
  const index = list.findIndex(m => m.id === movie.id);

  if (index > -1) {
    list.splice(index, 1);
    button.classList.remove("active");
    if (currentView === listName) card.remove();
  } else {
    list.push(movie);
    button.classList.add("active");
  }
  localStorage.setItem(listName, JSON.stringify(list));
}

function showMyList(listName, button) {
  setActiveTab(button);
  currentView = listName;
  searchInput.value = "";
  searchInput.placeholder = `Search in ${listName}...`;
  addCustomBtn.style.display = "block";
  resultsContainer.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: white; text-transform: capitalize; margin-bottom: 20px;">My ${listName}</h2>`;
  loadMoreBtn.style.display = "none";
  const savedMovies = JSON.parse(localStorage.getItem(listName)) || [];
  displayMovies(savedMovies);
}

// Stäng modal om man klickar utanför
window.onclick = function(event) {
  if (event.target.className === "modal") {
    closeCustomModal();
    closeDetailModal();
  }
}

window.showMyList = showMyList;
window.loadMore = loadMore;
window.goHome = goHome;
window.openCustomModal = openCustomModal;
window.closeCustomModal = closeCustomModal;
window.closeDetailModal = closeDetailModal;
