const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

let currentPage = 1;
let currentQuery = "";
let debounceTimer;

const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const loadMoreBtn = document.getElementById("loadMoreBtn");

// --- EVENT LISTENERS ---

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

// --- API-FUNKTIONER ---

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
    console.error("Fel vid hämtning:", error);
  }
}

function loadMore() {
  currentPage++;
  fetchMovies(false);
}

// --- VISNINGS-FUNKTIONER ---

function displayMovies(movies) {
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");

    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
      : "https://dummyimage.com/300x450/1a1a1a/666666&text=Ingen+bild";

    const year = movie.release_date ? movie.release_date.split("-")[0] : "????";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "?";

    // Vi skapar knappar med data-attribut för att undvika problem med JSON i strängar
    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}" loading="lazy">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="year">${year} • <span class="rating">★ ${rating}</span></div>
        <div class="actions">
          <button class="btn-save" data-type="watched">✅ Sett</button>
          <button class="btn-save" data-type="watchlist">⏳ Vill se</button>
          <button class="btn-save" data-type="favorites">❤️ Favorit</button>
        </div>
      </div>
    `;

    // Lägg till klick-event på knapparna i kortet
    card.querySelectorAll(".btn-save").forEach(button => {
      button.addEventListener("click", () => {
        const listType = button.getAttribute("data-type");
        toggleMovieInList(movie, listType);
      });
    });

    resultsContainer.appendChild(card);
  });
}

// --- LOGIK FÖR ATT SPARA (localStorage) ---

function toggleMovieInList(movie, listName) {
  let list = JSON.parse(localStorage.getItem(listName)) || [];
  const index = list.findIndex(m => m.id === movie.id);

  if (index > -1) {
    list.splice(index, 1);
    alert(`Borttagen från ${listName}`);
  } else {
    // Spara bara det viktigaste för att inte fylla minnet i onödan
    list.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average
    });
    alert(`Tillagd i ${listName}`);
  }

  localStorage.setItem(listName, JSON.stringify(list));
}

// --- VISA SPARADE LISTOR ---

function showMyList(listName) {
  const savedMovies = JSON.parse(localStorage.getItem(listName)) || [];
  
  // Rensa behållaren och sätt en rubrik
  resultsContainer.innerHTML = `<h2 style="grid-column: 1/-1; text-align: center; color: white; text-transform: capitalize;">Mina ${listName}</h2>`;
  loadMoreBtn.style.display = "none";

  if (savedMovies.length === 0) {
    resultsContainer.innerHTML += `<p style="grid-column: 1/-1; text-align: center; color: #ccc;">Du har inga filmer här än.</p>`;
    return;
  }

  displayMovies(savedMovies);
}

// Gör funktionen tillgänglig för HTML-knappar
window.showMyList = showMyList;
window.loadMore = loadMore;
