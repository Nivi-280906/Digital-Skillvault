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


function toggleTheme()
{
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    // save theme
    localStorage.setItem("theme", isDark ? "dark" : "light");

    updateIcon();

    // 🔥 IMPORTANT: update iframe (upload modal)
    const iframe = document.getElementById("uploadFrame");

    if (iframe && iframe.contentWindow)
    {
        iframe.contentWindow.document.body.classList.toggle("dark", isDark);
    }
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