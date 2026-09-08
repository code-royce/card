/* Your JS here. */
const details = document.getElementById("details");
const profilePhoto = document.getElementById("profile-photo");
const profileName = document.getElementById("profile-name");
const orange = document.getElementById("orange");
const blue = document.getElementById("blue");
const gray = document.getElementById("gray");
const bioCard = document.getElementById("bio-card");

function showDetails() {
    details.classList.toggle("hidden");
}

profilePhoto.addEventListener("click", showDetails);
profileName.addEventListener("click", showDetails);

function changeColor(color) {
    bioCard.style.backgroundColor = color;
}

orange.addEventListener("click", () => changeColor("#FF5F05"));
blue.addEventListener("click", () => changeColor("#13294B"));
gray.addEventListener("click", () => changeColor("#5C768D"));
