document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    console.log("Clicked:", btn.textContent.trim());
  });
});
