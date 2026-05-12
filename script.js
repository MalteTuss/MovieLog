const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

async function searchMovies() {
  const query = document.getElementById("searchInput").value.trim();

  if (!query) return;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    if (!data.results) {
      console.error("No results found:", data);
      return;
    }

    displayMovies(data.results);

  } catch (error) {
    console.error("API error:", error);
  }
}

function displayMovies(movies) {
  const container = document.getElementById("results");

  container.innerHTML = "";

  movies.forEach(movie => {
    const card = document.createElement("div");
    card.classList.add("movie");

    card.innerHTML = `
      <img src="${
        movie.poster_path
          ? "https://image.tmdb.org/t/p/w300" + movie.poster_path
          : "https://via.placeholder.com/300x450?text=No+Image"
      }" />
      <h3>${movie.title}</h3>
      <p>${movie.release_date || "Unknown year"}</p>
    `;

    container.appendChild(card);
  });
}
