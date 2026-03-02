// APPLY SAVED THEME ON LOAD
document.addEventListener("DOMContentLoaded", function()
{
    const savedTheme = localStorage.getItem("theme");

    if(savedTheme === "dark")
    {
        document.body.classList.add("dark");
    }
    else
    {
        document.body.classList.remove("dark");
    }

    updateIcon();
});


// TOGGLE THEME
function toggleTheme()
{
    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark"))
    {
        localStorage.setItem("theme","dark");
    }
    else
    {
        localStorage.setItem("theme","light");
    }

    updateIcon();
}


// UPDATE ICON
function updateIcon()
{
    const icon = document.getElementById("themeIcon");

    if(!icon) return;

    if(document.body.classList.contains("dark"))
        icon.innerText="☀";
    else
        icon.innerText="🌙";
}