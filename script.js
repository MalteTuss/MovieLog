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
    if (isNewSearch) {
      resultsContainer.innerHTML = "";
      currentPage = 1;
    }

    let moviesToDisplay = [];
    const targetAmount = 20; // Hur många filmer vi vill visa per "laddning"

    // Loopa tills vi har 20 filmer med posters ELLER slut på sidor
    while (moviesToDisplay.length < targetAmount) {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=true`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (!data.results || data.results.length === 0) break;

      // Filtrera fram filmer som HAR poster
      const filtered = data.results.filter(m => m.poster_path);
      
      // Lägg till de filtrerade filmerna i vår temporära lista
      moviesToDisplay = [...moviesToDisplay, ...filtered];

      // Kolla om vi nått sista sidan i API:et
      if (currentPage >= data.total_pages) {
        loadMoreBtn.style.display = "none";
        break;
      } else {
        loadMoreBtn.style.display = "block";
      }

      // Om vi inte har 20 filmer än, gå till nästa sida direkt
      if (moviesToDisplay.length < targetAmount) {
        currentPage++;
      }
    }

    // Om vi fick fler än 20 (t.ex. 25), ta bara de första 20
    // De överskjutande sparas inte, vilket är enklast för att hålla koden ren
    const finalBatch = moviesToDisplay.slice(0, targetAmount);
    
    console.log("Visar antal filmer:", finalBatch.length, "Använt sidnummer upp till:", currentPage);
    
    displayMovies(finalBatch);

  } catch (error) {
    console.error("Fel vid hämtning:", error);
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
      : "https://dummyimage.com/300x450/1a1a1a/666666&text=Ingen+bild";

    const year = movie.release_date
      ? movie.release_date.split("-")[0]
      : "????";

    const rating = movie.vote_average
      ? movie.vote_average.toFixed(1)
      : "?";

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
