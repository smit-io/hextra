// {{ $faviconDarkExists := fileExists (path.Join "static" "favicon-dark.svg") }}
(function () {
  const faviconEl = document.getElementById("favicon-svg");
  const faviconDarkExists = "{{ $faviconDarkExists }}" === "true";

  if (faviconEl && faviconDarkExists) {
    const lightFavicon = '{{ "favicon.svg" | relURL }}';
    const darkFavicon = '{{ "favicon-dark.svg" | relURL }}';

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    /**
     * Set the favicon href based on whether a dark color scheme is active.
     *
     * If `e.matches` is true the favicon is switched to the dark variant; otherwise it uses the light variant.
     *
     * @param {MediaQueryList|MediaQueryListEvent} e - The media query (or its change event) with a boolean `matches` indicating dark-mode.
     */
    function updateFavicon(e) {
      faviconEl.href = e.matches ? darkFavicon : lightFavicon;
    }

    // Set favicon on load
    updateFavicon(darkModeQuery);

    // Listen for system preference changes
    darkModeQuery.addEventListener("change", updateFavicon);
  }
})();
