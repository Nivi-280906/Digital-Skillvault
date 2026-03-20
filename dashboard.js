/*************************
 DOM ELEMENTS
*************************/

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const totalCerts = document.getElementById("totalCerts");
const verified = document.getElementById("verified");
const skills = document.getElementById("skills");
const learningStatus = document.getElementById("learningStatus");

const certList = document.getElementById("certList");

const avatarImg = document.getElementById("avatarImg");
const avatarFallback = document.getElementById("avatarFallback");

const settingsBox = document.getElementById("settingsBox");
const uploadFrameModal = document.getElementById("uploadFrameModal");

const editModal = document.getElementById("editModal");
const editName = document.getElementById("editName");

const dashboardSearch = document.getElementById("dashboardSearch");

let allCertificates = [];
let strengthChart = null;


/*************************
 FIREBASE
*************************/

const auth = firebase.auth();
const db = firebase.firestore();


/*************************
 AUTH STATE
*************************/

auth.onAuthStateChanged(user =>
{

if (!user)
{
location.href = "login.html";
return;
}

userName.innerText = user.displayName || "Student";
userEmail.innerText = user.email;


/* avatar */

if (user.photoURL)
{
avatarImg.src = user.photoURL;
avatarImg.style.display = "block";
avatarFallback.style.display = "none";
}
else
{
avatarFallback.innerText =
user.email[0].toUpperCase();

avatarFallback.style.display = "flex";
avatarImg.style.display = "none";
}


updateLearningStatus(user.uid);
loadCertificates(user.uid);

});


/*************************
 LEARNING STATUS
*************************/

function updateLearningStatus(uid)
{

const today = new Date().toDateString();

db.collection("certificates")
.where("uid","==",uid)
.onSnapshot(snapshot =>
{

let activeToday = false;

snapshot.forEach(doc =>
{

const d = doc.data();

if (!d.createdAt) return;

const uploadDate =
d.createdAt.toDate().toDateString();

if (uploadDate === today)
activeToday = true;

});

learningStatus.innerText =
activeToday ? "Active" : "Inactive";

learningStatus.className =
activeToday ? "status-active" : "status-inactive";

});

}


/*************************
 LOAD CERTIFICATES
*************************/

function loadCertificates(uid)
{

db.collection("certificates")
.where("uid","==",uid)
.onSnapshot(snapshot =>
{

let totalCount = 0;
let verifiedCount = 0;
let skillsSet = new Set();

allCertificates = [];

snapshot.forEach(doc =>
{

const d = doc.data();

totalCount++;

if (d.verified === true || d.status === "verified")
verifiedCount++;

if (d.skill)
skillsSet.add(d.skill);

allCertificates.push(d);

});


totalCerts.innerText = totalCount;
verified.innerText = verifiedCount;
skills.innerText = skillsSet.size;


updateStrengthPie(allCertificates);
renderCertificates();

});

}


/*************************
 PIE CHART (PROFESSIONAL VERSION)
*************************/

function updateStrengthPie(certificates)
{

let beginner = 0;
let intermediate = 0;
let advanced = 0;


// count VERIFIED certificates
certificates.forEach(cert =>
{

if(cert.verified !== true && cert.status !== "verified")
return;

const level = (cert.level || "").toLowerCase();

if(level === "beginner") beginner++;
else if(level === "intermediate") intermediate++;
else if(level === "advanced") advanced++;

});


const verifiedCount =
beginner + intermediate + advanced;


// profile strength calculation
let profileStrength =
verifiedCount * 0.2;

if(profileStrength > 100)
profileStrength = 100;

profileStrength =
Math.round(profileStrength * 10) / 10;


const centerText =
document.getElementById("strengthPercent");

centerText.innerText =
profileStrength + "%";


const ctx =
document.getElementById("strengthPie")
.getContext("2d");


// destroy old chart
if(strengthChart)
strengthChart.destroy();


// PROFESSIONAL GLOW PLUGIN
const glowPlugin =
{
id:"glowEffect",

beforeDatasetDraw(chart)
{

const {ctx} = chart;

ctx.save();

if(document.body.classList.contains("dark"))
{
ctx.shadowBlur = 18;
ctx.shadowColor =
"rgba(255,255,255,0.15)";
}
else
{
ctx.shadowBlur = 6;
ctx.shadowColor =
"rgba(0,0,0,0.08)";
}

},

afterDatasetDraw(chart)
{
chart.ctx.restore();
}

};


// CREATE CHART
strengthChart =
new Chart(ctx,
{

type:"doughnut",

data:
{

labels:[
"Beginner",
"Intermediate",
"Advanced"
],

datasets:[
{

data:[
beginner,
intermediate,
advanced
],

backgroundColor:[
"#22c55e",
"#f59e0b",
"#ef4444"
],

borderColor:[
"#4ade80",
"#fde047",
"#f87171"
],

borderWidth:2,

hoverOffset:6

}]

},

options:
{

cutout:"75%",

plugins:
{
legend:{display:false}
},

onHover:(event,elements)=>
{

if(elements.length > 0)
{

const index =
elements[0].index;

const value =
strengthChart.data.datasets[0].data[index];

const percent =
verifiedCount === 0
? 0
: Math.round(
(value / verifiedCount) * 100
);

centerText.innerText =
percent + "%";

}
else
{
centerText.innerText =
profileStrength + "%";
}

}

},

plugins:[glowPlugin]

});

}


/*************************
 RENDER CERTIFICATES
*************************/

function renderCertificates()
{

const searchValue =
dashboardSearch?.value.toLowerCase() || "";

certList.innerHTML = "";

allCertificates.forEach(d =>
{

if(
!d.title?.toLowerCase().includes(searchValue)
&&
!d.skill?.toLowerCase().includes(searchValue)
) return;


const date =
d.createdAt
? d.createdAt.toDate().toLocaleDateString()
: "Just now";

const fileUrl =
d.file || "";


certList.innerHTML +=
`
<div class="cert-row" onclick="openCert('${fileUrl}')">

<div class="cert-left">

<div class="cert-icon">📄</div>

<div>

<div class="cert-title">
${d.title || "Certificate"}
</div>

<div class="cert-tags">

<span class="tag skill">
${d.skill || ""}
</span>

<span class="tag level ${(d.level||"").toLowerCase()}">
${d.level || ""}
</span>

</div>

</div>

</div>

<div class="cert-date">
${date}
</div>

</div>
`;

});

}


/*************************
 EDIT PROFILE
*************************/

function openProfile()
{
editModal.classList.add("show");
editName.value = userName.innerText;
}

function closeProfile()
{
editModal.classList.remove("show");
}

function saveProfile()
{

const user = auth.currentUser;

if(!user) return;

const newName =
editName.value.trim();

if(newName === "")
{
alert("Please enter name");
return;
}

user.updateProfile({
displayName:newName
})
.then(() =>
{
userName.innerText = newName;
closeProfile();
alert("Profile updated successfully");
})
.catch(err =>
{
alert(err.message);
});

}


/*************************
 SETTINGS
*************************/

function toggleSettings(e)
{
  e.stopPropagation(); // prevent closing immediately

  settingsBox.classList.toggle("show");
}

/*************************
 LOGOUT
*************************/

function logout()
{

auth.signOut()
.then(() =>
location.href="login.html");

}


/*************************
 SEARCH
*************************/

dashboardSearch
?.addEventListener(
"input",
renderCertificates
);

/*************************
UPLOAD MODAL
*************************/

function openUploadModal()
{
uploadFrameModal.style.display = "flex";
}

function closeUploadFrame()
{
uploadFrameModal.style.display = "none";
}

/*************************
 OPEN PORTFOLIO
*************************/

function openPortfolio()
{

const user = auth.currentUser;

if (!user)
{
alert("Please login");
return;
}

window.location.href =
"portfolio.html?uid=" + user.uid;

}


/*************************
 CLOSE MODAL OUTSIDE CLICK
*************************/

window.addEventListener(
"click",
function(event)
{
if(event.target === editModal)
closeProfile();
}
);
// Close when clicking outside
document.addEventListener("click", function () {
  settingsBox.classList.remove("show");
});

// Prevent closing when clicking inside dropdown
settingsBox.addEventListener("click", function (e) {
  e.stopPropagation();
});
function closeSettings()
{
  settingsBox.classList.remove("show");
}
function changePassword()
{
  const user = auth.currentUser;

  if (!user)
  {
    alert("User not logged in");
    return;
  }

  const email = user.email;

  auth.sendPasswordResetEmail(email)
  .then(() =>
  {
    alert("Password reset email sent. Check your inbox.");
  })
  .catch(err =>
  {
    alert(err.message);
  });

  // close dropdown after click
  closeSettings();
}