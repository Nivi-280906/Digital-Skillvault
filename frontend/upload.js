/* ================= THEME SYNC ================= */

document.addEventListener("DOMContentLoaded", () =>
{
const theme = localStorage.getItem("theme") || "light";

document.body.classList.remove("light","dark");
document.body.classList.add(theme);
});


/* ================= LOAD SETTINGS ================= */

function getSettings()
{
return JSON.parse(localStorage.getItem("settings")) || {
autoRename:true,
duplicateWarning:true,
recycleBin:true
};
}


/* ================= FIREBASE ================= */

const auth = firebase.auth();
const db = firebase.firestore();

const CLOUD_NAME = "dinkenzbi";
const UPLOAD_PRESET = "skillvault";


/* ================= DOM ELEMENTS ================= */

const drop = document.getElementById("drop");
const fileInput = document.getElementById("file");

const skillSelect = document.getElementById("skill");
const otherSkill = document.getElementById("otherSkill");

const titleInput = document.getElementById("title");
const levelInput = document.getElementById("level");
const descInput = document.getElementById("desc");

const bar = document.getElementById("bar");

const uploadBtn = document.getElementById("uploadBtn");


let selectedFile = null;
let uploading = false;


/* ================= AUTH CHECK ================= */

auth.onAuthStateChanged(user =>
{
if (!user)
location = "login.html";
});


/* ================= FILE SELECT ================= */

drop.onclick = () => fileInput.click();

fileInput.onchange = e =>
{
selectedFile = e.target.files[0];

if (selectedFile)
drop.innerText = selectedFile.name;
};


/* ================= SKILL SELECT ================= */

skillSelect.onchange = () =>
{
otherSkill.style.display =
skillSelect.value === "Other"
? "block"
: "none";
};


/* ================= UPLOAD BUTTON ================= */

uploadBtn.onclick = uploadCert;


/* ================= MAIN UPLOAD FUNCTION ================= */

function uploadCert()
{

if(uploading) return;

uploading = true;

const settings = getSettings();


/* GET VALUES */

let title = titleInput.value.trim();
const level = levelInput.value;
const desc = descInput.value;

let finalSkill = skillSelect.value;

if(finalSkill === "Other")
finalSkill = otherSkill.value.trim();


/* VALIDATION */

if(!selectedFile || !title || !finalSkill || !level)
{
alert("Please fill all fields and select certificate");
uploading = false;
return;
}


/* CHECK USER */

const user = auth.currentUser;

if(!user)
{
alert("Please login again");
uploading = false;
return;
}


/* ================= AUTO RENAME ================= */

if(settings.autoRename)
{
const now = new Date();

title =
finalSkill + "_" +
level + "_" +
now.getFullYear() + "_" +
(now.getMonth()+1) + "_" +
now.getDate();
}


/* ================= DUPLICATE CHECK ================= */

if(settings.duplicateWarning)
{

db.collection("certificates")
.where("uid","==",user.uid)
.where("title","==",title)
.get()
.then(snapshot =>
{

if(!snapshot.empty)
{
alert("Duplicate certificate already exists!");
uploading = false;
return;
}

startUpload(title, finalSkill, level, desc, user);

});

}
else
{
startUpload(title, finalSkill, level, desc, user);
}

}


/* ================= START UPLOAD ================= */

function startUpload(title, finalSkill, level, desc, user)
{

bar.style.width = "20%";


/* UPLOAD TO CLOUDINARY */

const formData = new FormData();

formData.append("file", selectedFile);
formData.append("upload_preset", UPLOAD_PRESET);


fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
{
method:"POST",
body:formData
})

.then(res => res.json())

.then(data =>
{

if(!data.secure_url)
throw new Error("Upload failed");

bar.style.width = "80%";


/* SAVE TO FIRESTORE */

return db.collection("certificates").add({

uid:user.uid,

title:title,

skill:finalSkill,

level:level,

desc:desc,

file:data.secure_url,

status:"verified",

placementEligible:true,

createdAt:
firebase.firestore.FieldValue.serverTimestamp()

});

})

.then(() =>
{

bar.style.width = "100%";

alert("Certificate uploaded successfully");


/* CLOSE MODAL */

const modal =
parent.document.getElementById("uploadFrameModal");

if(modal)
modal.style.display = "none";


resetForm();

})

.catch(error =>
{

console.error(error);

alert("Upload failed. Try again.");

})

.finally(() =>
{

uploading = false;

setTimeout(() =>
{
bar.style.width = "0%";
},800);

});

}


/* ================= RESET FORM ================= */

function resetForm()
{

titleInput.value = "";
levelInput.value = "";
descInput.value = "";

skillSelect.value = "";

otherSkill.value = "";
otherSkill.style.display = "none";

fileInput.value = "";

selectedFile = null;

drop.innerText = "Click to Select Certificate";

}