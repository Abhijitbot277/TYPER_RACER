if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/TYPER_RACER/sw.js").catch(() => {});
  });
}
