const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

async function searchMovies() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) return;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    // Här anropas funktionen
    displayMovies(data.results); 

  } catch (error) {
    console.error("API error:", error);
  }
}

// Se till att denna ligger helt utanför searchMovies måsvingar
function displayMovies(movies) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!movies || movies.length === 0) {
    container.innerHTML = "<p>Inga filmer hittades.</p>";
    return;
  }

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");
    card.innerHTML = `
      <img src="${movie.poster_path ? 'https://image.tmdb.org/t/p/w300' + movie.poster_path : 'https://via.placeholder.com/300x450'}" />
      <h3>${movie.title}</h3>
      <p>${movie.release_date || "Oklart år"}</p>
    `;
    container.appendChild(card);
  });
}
