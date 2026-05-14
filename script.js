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
  addCustomBtn.style.display = "none"; // Dölj knappen på sökfliken
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

// --- MODAL LOGIK ---

function openModal() {
  document.getElementById("customMovieModal").style.display = "block";
}

function closeModal() {
  document.getElementById("customMovieModal").style.display = "none";
  document.getElementById("customMovieForm").reset();
}

document.getElementById("customMovieForm").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const title = document.getElementById("customTitle").value;
  const year = document.getElementById("customYear").value || "????";
  const poster = document.getElementById("customPoster").value || "";
  
  const customMovie = {
    id: "custom-" + Date.now(), // Unikt ID för att inte krocka med TMDB
    title: title,
    release_date: year,
    poster_path: poster, // Vi sparar hela URL:en här för egna filmer
    vote_average: 0,
    isCustom: true
  };

  saveCustomMovie(customMovie);
  closeModal();
  showMyList(currentView, document.querySelector(`.nav-buttons button.active`));
});

function saveCustomMovie(movie) {
  let list = JSON.parse(localStorage.getItem(currentView)) || [];
  list.unshift(movie); // Lägg till högst upp
  localStorage.setItem(currentView, JSON.stringify(list));
}

// --- API FUNCTIONS ---

async function fetchMovies(isNewSearch = false) {
  try {
    if (isNewSearch) {
      resultsContainer.innerHTML = "";
      currentPage = 1;
    }

    let moviesToDisplay = [];
    const targetAmount = 20;

    while (moviesToDisplay.length < targetAmount) {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=true`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (!data.results || data.results.length === 0) break;

      const filtered = data.results.filter(m => m.poster_path);
      moviesToDisplay = [...moviesToDisplay, ...filtered];

      if (currentPage >= data.total_pages) {
        loadMoreBtn.style.display = "none";
        break;
      } else {
        loadMoreBtn.style.display = "block";
      }

      if (moviesToDisplay.length < targetAmount) {
        currentPage++;
      }
    }

    const finalBatch = moviesToDisplay.slice(0, targetAmount);
    displayMovies(finalBatch);

  } catch (error) {
    console.error("Error fetching movies:", error);
  }
}

function loadMore() {
  currentPage++;
  fetchMovies(false);
}

// --- LOCAL FILTER FUNCTION ---

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

// --- DISPLAY FUNCTIONS ---

function displayMovies(movies) {
  const isInList = (movieId, listName) => {
    const list = JSON.parse(localStorage.getItem(listName)) || [];
    return list.some(m => m.id === movieId);
  };

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");

    let poster;
    if (movie.isCustom) {
      poster = movie.poster_path || "https://dummyimage.com/300x450/1a1a1a/666666&text=No+Image";
    } else {
      poster = movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : "https://dummyimage.com/300x450/1a1a1a/666666&text=No+Image";
    }

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
    if (currentView === listName) {
      card.remove();
      if (list.length === 0) {
        resultsContainer.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: white; text-transform: capitalize; margin-bottom: 20px;">My ${listName}</h2>
                                      <p style="grid-column: 1/-1; text-align: center; color: #ccc;">Your list is currently empty.</p>`;
      }
    }
  } else {
    list.push(movie);
    button.classList.add("active");
  }

  localStorage.setItem(listName, JSON.stringify(list));
}

// --- SHOW LISTS ---

function showMyList(listName, button) {
  setActiveTab(button);
  currentView = listName;
  searchInput.value = "";
  searchInput.placeholder = `Search in ${listName}...`;
  
  // Visa knappen för att lägga till egen film
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

window.onclick = function(event) {
  const modal = document.getElementById("customMovieModal");
  if (event.target == modal) closeModal();
}

window.showMyList = showMyList;
window.loadMore = loadMore;
window.goHome = goHome;
window.openModal = openModal;
window.closeModal = closeModal;
