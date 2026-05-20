document.addEventListener("DOMContentLoaded", function () {
  const greetBtn = document.getElementById("greet-btn");
  const greetMessage = document.getElementById("greet-message");
  const contactForm = document.getElementById("contact-form");
  const nameInput = document.getElementById("name-input");
  const formResponse = document.getElementById("form-response");

  greetBtn.addEventListener("click", function () {
    greetMessage.textContent = "Hello! Welcome to my website!";
    greetMessage.classList.add("visible");
  });

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (name) {
      formResponse.textContent = "Thanks, " + name + "! Message received.";
      formResponse.classList.add("visible");
      nameInput.value = "";
    }
  });
});
