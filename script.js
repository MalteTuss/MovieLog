const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";
let currentPage = 1;
let currentQuery = "";
let debounceTimer;

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const loadMoreBtn = document.getElementById("loadMoreBtn");

searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  
  clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    if (query.length >= 2) {
      currentQuery = query;
      currentPage = 1;
      fetchMovies(true);
    } else if (query.length === 0) {
      resultsContainer.innerHTML = "";
      loadMoreBtn.style.display = "none";
    }
  }, 400);
});

async function fetchMovies(isNewSearch = false) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    const res = await fetch(url);
    const data = await res.json();

    if (isNewSearch) resultsContainer.innerHTML = "";

    if (data.results && data.results.length > 0) {
      displayMovies(data.results);
      
      loadMoreBtn.style.display = data.total_pages > currentPage ? "block" : "none";
    } else if (isNewSearch) {
      resultsContainer.innerHTML = `<p style="text-align:center; grid-column:1/-1; padding:3rem;">Inga filmer hittades för "${currentQuery}"</p>`;
      loadMoreBtn.style.display = "none";
    }
  } catch (error) {
    console.error("Fel:", error);
  }
}

function loadMore() {
  currentPage++;
  fetchMovies(false);
}

function displayMovies(movies) {
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");

    const poster = movie.poster_path 
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` 
      : "https://via.placeholder.com/300x450/1a1a1a/666?text=Ingen+bild";

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
