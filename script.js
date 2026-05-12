const API_KEY = "DIN_TMDB_API_KEY";

async function searchMovies() {
  const query = document.getElementById("searchInput").value;

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
  );

  const data = await res.json();

  displayMovies(data.results);
}

function displayMovies(movies) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  movies.forEach(movie => {
    const div = document.createElement("div");

    div.innerHTML = `
      <h3>${movie.title}</h3>
      <img src="https://image.tmdb.org/t/p/w200${movie.poster_path}" />
    `;

    container.appendChild(div);
  });
}
