const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

let currentPage = 1;
let currentQuery = "";
let debounceTimer;
let currentView = "search"; // Håller koll på om vi är i 'search', 'watched', 'watchlist' eller 'favorites'

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const addCustomBtn = document.getElementById("addCustomBtn");

// --- NAVIGATION & FLIKHANTERING ---

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

function showMyList(listName, button) {
  setActiveTab(button);
  currentView = listName;
  searchInput.value = "";
  searchInput.placeholder = `Search in ${listName}...`;
  
  // Visa knappen för att lägga till egen film endast i personliga listor
  addCustomBtn.style.display = "block";

  const savedMovies = JSON.parse(localStorage.getItem(listName)) || [];
  
  resultsContainer.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: white; text-transform: capitalize; margin-bottom: 20px;">My ${listName}</h2>`;
  loadMoreBtn.style.display = "none";

  if (savedMovies.length === 0) {
    resultsContainer.innerHTML += `<p style="grid-column: 1/-1; text-align: center; color: #ccc;">Your list is currently empty.</p>`;
    return;
  }

  displayMovies(savedMovies);
}

// --- SÖKLOGIK (VARIERAR BEROENDE PÅ VY) ---

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim().toLowerCase();
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (currentView === "search") {
      // API-SÖKNING (TMDB)
      if (query.length >= 2) {
        currentQuery = query;
        currentPage = 1;
        fetchMovies(true);
      } else if (query.length === 0) {
        resultsContainer.innerHTML = "";
        loadMoreBtn.style.display = "none";
      }
    } else {
      // LOKAL FILTRERING (I sparade listor)
      filterLocalList(query);
    }
  }, 400);
});

function filterLocalList(query) {
  const savedMovies = JSON.parse(localStorage.getItem(currentView)) || [];
  const filtered = savedMovies.filter(movie => 
    movie.title.toLowerCase().includes(query)
  );

  resultsContainer.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: white; text-transform: capitalize; margin-bottom: 20px;">My ${currentView}</h2>`;

  if (filtered.length === 0) {
    resultsContainer.innerHTML += `<p style="grid-column: 1/-1; text-align: center; color: #ccc;">No movies found matching "${query}"</p>`;
  } else {
    displayMovies(filtered);
  }
}

// --- API-FUNKTIONER ---

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
      
      // Visa Load More om det finns fler sidor
      loadMoreBtn.style.display = (data.total_pages > currentPage) ? "block" : "none";
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
  }
}

function loadMore() {
  currentPage++;
  fetchMovies(false);
}

// --- DETALJVY (MODAL) ---

async function showMovieDetails(movieId, isCustom) {
  const modal = document.getElementById("movieDetailsModal");
  const content = document.getElementById("movieDetailsContent");
  content.innerHTML = "<p style='text-align:center; padding: 20px;'>Loading details...</p>";
  modal.style.display = "block";

  if (isCustom) {
    // För egna filmer: Hitta objektet i nuvarande lista
    const list = JSON.parse(localStorage.getItem(currentView)) || [];
    const movie = list.find(m => m.id === movieId);
    renderDetails(movie);
  } else {
    // För API-filmer: Hämta fullständig info + credits (skådespelare)
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
      const movie = await res.json();
      renderDetails(movie);
    } catch (err) {
      content.innerHTML = "<p style='text-align:center;'>Could not load details from TMDB.</p>";
    }
  }
}

function renderDetails(movie) {
  const content = document.getElementById("movieDetailsContent");
  
  // Hantera poster-URL
  const poster = movie.isCustom ? 
    (movie.poster_path || "https://dummyimage.com/300x450/1a1a1a/666666&text=No+Image") :
    `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "N/A";
  const cast = movie.credits ? movie.credits.cast.slice(0, 5).map(c => c.name).join(", ") : "N/A";
  const year = movie.release_date ? movie.release_date.split("-")[0] : "????";

  content.innerHTML = `
    <div class="detail-container">
      <img src="${poster}" alt="${movie.title}">
      <div class="detail-info">
        <h2>${movie.title} (${year})</h2>
        <p><strong>Rating:</strong> ★ ${movie.vote_average ? movie.vote_average.toFixed(1) : '?'}</p>
        <p><strong>Genres:</strong> ${genres}</p>
        <p><strong>Cast:</strong> ${cast}</p>
        <div class="overview">
          <strong>Overview:</strong>
          <p>${movie.overview || "No description available for this movie."}</p>
        </div>
      </div>
    </div>
  `;
}

function closeDetailModal() {
  document.getElementById("movieDetailsModal").style.display = "none";
}

// --- MANUELL UPPLADDNING (CUSTOM MOVIE) ---

function openCustomModal() {
  document.getElementById("customMovieModal").style.display = "block";
}

function closeCustomModal() {
  document.getElementById("customMovieModal").style.display = "none";
  document.getElementById("customMovieForm").reset();
}

document.getElementById("customMovieForm").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const title = document.getElementById("customTitle").value;
  const year = document.getElementById("customYear").value || "????";
  const poster = document.getElementById("customPoster").value || "";
  
  const customMovie = {
    id: "custom-" + Date.now(),
    title: title,
    release_date: year,
    poster_path: poster,
    vote_average: 0,
    isCustom: true,
    overview: "User added this movie manually."
  };

  let list = JSON.parse(localStorage.getItem(currentView)) || [];
  list.unshift(customMovie);
  localStorage.setItem(currentView, JSON.stringify(list));
  
  closeCustomModal();
  showMyList(currentView, document.querySelector(`.nav-buttons button.active`));
});

// --- RENDERINGS-LOGIK ---

function displayMovies(movies) {
  const isInList = (movieId, listName) => {
    const list = JSON.parse(localStorage.getItem(listName)) || [];
    return list.some(m => m.id === movieId);
  };

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");
    
    // Klick på kortet öppnar detaljer (men inte om man klickar på knapparna)
    card.onclick = () => showMovieDetails(movie.id, movie.isCustom);

    const poster = movie.isCustom ? 
      (movie.poster_path || "https://dummyimage.com/300x450/1a1a1a/666666&text=No+Image") :
      `https://image.tmdb.org/t/p/w342${movie.poster_path}`;

    const year = movie.release_date ? movie.release_date.split("-")[0] : "????";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "?";

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" loading="lazy">
      <div class="movie-info">
        <h3>${movie.title} ${movie.isCustom ? '<small style="color: #e50914;">(Custom)</small>' : ''}</h3>
        <div class="year">${year} • <span class="rating">★ ${rating}</span></div>
        <div class="actions">
          <button class="btn-save ${isInList(movie.id, 'watched') ? 'active' : ''}" data-type="watched">✅ Watched</button>
          <button class="btn-save ${isInList(movie.id, 'watchlist') ? 'active' : ''}" data-type="watchlist">⏳ Watchlist</button>
          <button class="btn-save ${isInList(movie.id, 'favorites') ? 'active' : ''}" data-type="favorites">❤️ Favorite</button>
        </div>
      </div>
    `;

    // Stoppa klick-eventet från att bubbla upp till kortet när man klickar på knapparna
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

function toggleMovieInList(movie, listName, button, card) {
  let list = JSON.parse(localStorage.getItem(listName)) || [];
  const index = list.findIndex(m => m.id === movie.id);

  if (index > -1) {
    list.splice(index, 1);
    button.classList.remove("active");
    if (currentView === listName) {
      card.remove();
    }
  } else {
    list.push(movie);
    button.classList.add("active");
  }
  localStorage.setItem(listName, JSON.stringify(list));
}

// Stäng modal om man klickar utanför innehållet
window.onclick = function(event) {
  if (event.target.className === "modal") {
    closeCustomModal();
    closeDetailModal();
  }
};

// Exponera funktioner till HTML
window.showMyList = showMyList;
window.loadMore = loadMore;
window.goHome = goHome;
window.openCustomModal = openCustomModal;
window.closeCustomModal = closeCustomModal;
window.closeDetailModal = closeDetailModal;
