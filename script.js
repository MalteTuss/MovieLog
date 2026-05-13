const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

let currentPage = 1;
let currentQuery = "";
let debounceTimer;
let totalLoaded = 0; // Räknare för totalt antal filmer

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// Skapa ett element för att visa statistiken (om det inte redan finns i din HTML)
let statsDisplay = document.getElementById("statsDisplay");
if (!statsDisplay) {
  statsDisplay = document.createElement("div");
  statsDisplay.id = "statsDisplay";
  statsDisplay.style.margin = "10px";
  statsDisplay.style.fontWeight = "bold";
  document.body.insertBefore(statsDisplay, resultsContainer);
}

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (query.length >= 2) {
      currentQuery = query;
      currentPage = 1;
      totalLoaded = 0; // Nollställ räknaren vid ny sökning
      fetchMovies(true);
    } else if (query.length === 0) {
      resultsContainer.innerHTML = "";
      loadMoreBtn.style.display = "none";
      totalLoaded = 0;
      updateStats();
    }
  }, 400);
});

async function fetchMovies(isNewSearch = false) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=true`;

    const res = await fetch(url);
    const data = await res.json();

    if (isNewSearch) {
      resultsContainer.innerHTML = "";
    }

    // Vi tar ALLA filmer nu, även de utan bild
    const movies = data.results;
    
    // Uppdatera räknaren
    totalLoaded += movies.length;
    updateStats();

    displayMovies(movies);

    // Visa/dölj "Ladda mer" baserat på om det finns fler sidor
    loadMoreBtn.style.display = (currentPage < data.total_pages) ? "block" : "none";

    console.log(`Laddat sida ${currentPage}. Filmer på denna sida: ${movies.length}. Totalt: ${totalLoaded}`);

  } catch (error) {
    console.error("Fel:", error);
  }
}

function updateStats() {
  statsDisplay.innerText = `Totalt antal filmer laddade: ${totalLoaded}`;
}

function loadMore() {
  currentPage++;
  fetchMovies(false);
}

function displayMovies(movies) {
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");

    // Om poster_path saknas, använd en snygg placeholder
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : "https://via.placeholder.com/342x513?text=Bild+saknas"; // Din custom placeholder

    const year = movie.release_date ? movie.release_date.split("-")[0] : "????";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "?";

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" loading="lazy">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="year">${year} • <span class="rating">★ ${rating}</span></div>
      </div>
    `;

    resultsContainer.appendChild(card);
  });
}
