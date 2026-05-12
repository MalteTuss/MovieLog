const API_KEY = "d133f3d52325736c0359bfd16cf21ca0";

async function searchMovies() {
  console.log("SEARCH CLICKED");

  const query = document.getElementById("searchInput").value;

  console.log("QUERY:", query);

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${query}`
  );

  console.log("RAW RESPONSE:", res);

  const data = await res.json();

  console.log("DATA:", data);

  displayMovies(data.results);
}
