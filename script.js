const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";
let currentPage = 1;
let currentQuery = "";
let debounceTimer;

const searchInput = document.getElementById("searchInput");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const resultsContainer = document.getElementById("results");

// Lyssnar på när användaren skriver
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    if (query.length >= 2) {
      currentQuery = query;
      currentPage = 1;
      fetchMovies(true); // true = rensa gamla resultat
    } else if (query.length === 0) {
      resultsContainer.innerHTML = "";
      loadMoreBtn.style.display = "none";
    }
  }, 400); // Väntar 0.4 sekunder efter sista knapptrycket
});

async function fetchMovies(isNewSearch = false) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    const res = await fetch(url);
    const data = await res.json();

    if (isNewSearch) {
      resultsContainer.innerHTML = "";
    }

    if (data.results && data.results.length > 0) {
      displayMovies(data.results);
      
      // Visa knappen bara om det finns fler sidor att hämta
      if (data.total_pages > currentPage) {
        loadMoreBtn.style.display = "block";
      } else {
        loadMoreBtn.style.display = "none";
      }
    } else {
      if (isNewSearch) resultsContainer.innerHTML = "<p>Inga filmer hittades.</p>";
      loadMoreBtn.style.display = "none";
    }

  } catch (error) {
    console.error("Fel vid hämtning:", error);
  }
}

function loadMore() {
  currentPage++;
  fetchMovies(false); // false = lägg till i listan istället för att rensa
}

function displayMovies(movies) {
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");

    const poster = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` 
      : "https://via.placeholder.com/300x450?text=Ingen+bild";

    const year = movie.release_date ? movie.release_date.split("-")[0] : "Oklart år";

    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" loading="lazy">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <span>${year}</span>
      </div>
    `;
    resultsContainer.appendChild(card);
  });
}
