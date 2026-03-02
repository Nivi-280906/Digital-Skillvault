// LOAD SETTINGS OR DEFAULT
let settings = JSON.parse(localStorage.getItem("settings")) || {
  recycleBin: true,
  confirmDelete: true
};

// APPLY VALUES TO SWITCHES
document.getElementById("recycleBin").checked = settings.recycleBin;
document.getElementById("confirmDelete").checked = settings.confirmDelete;

// SAVE CHANGES
document.getElementById("recycleBin").onchange = function () {
  settings.recycleBin = this.checked;
  saveSettings();
};

document.getElementById("confirmDelete").onchange = function () {
  settings.confirmDelete = this.checked;
  saveSettings();
};

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
}

// BACKUP FUNCTION
document.getElementById("backupBtn").onclick = function () {

  let data = localStorage.getItem("certificates");

  if (!data) {
    alert("No certificates to backup");
    return;
  }

  let blob = new Blob([data], { type: "application/json" });

  let link = document.createElement("a");

  link.href = URL.createObjectURL(blob);

  link.download = "SkillVault_Backup.json";

  link.click();
};