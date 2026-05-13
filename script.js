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
