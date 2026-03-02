/*********************************
FIREBASE INIT
*********************************/
const auth = firebase.auth();
const db = firebase.firestore();


/*********************************
ELEMENTS
*********************************/
const certList = document.getElementById("certList");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

const avatarImg = document.getElementById("avatarImg");
const avatarFallback = document.getElementById("avatarFallback");

const shareModal = document.getElementById("shareModal");
const shareLink = document.getElementById("shareLink");

const viewerList = document.getElementById("viewerList");
const accessLevelSelect = document.getElementById("accessLevel");
const ownerIdElement = document.getElementById("ownerId");


/*********************************
GET UID
*********************************/
const params = new URLSearchParams(window.location.search);
let uid = null;
let currentCertId = "";
let currentAccessLevel = "view";
let currentOwnerUid = "";
let currentFileURL = "";   // ADD THIS

/*********************************
AUTH STATE
*********************************/
/*********************************
AUTH STATE (FIXED)
*********************************/
auth.onAuthStateChanged(user =>
{
    if(!user)
    {
        alert("Please login first");
        location.href = "login.html";
        return;
    }

    // Always use logged in user UID
    uid = user.uid;

    console.log("Logged in UID:", uid); // debug

    loadUser();
    loadCertificates();
});


/*********************************
LOAD USER
*********************************/
function loadUser()
{
    db.collection("users")
    .doc(uid)
    .get()
    .then(doc =>
    {
        if(!doc.exists) return;

        const d = doc.data();

        userName.innerText = d.name || "Student";
        userEmail.innerText = d.email || "";

        if(d.photo)
        {
            avatarImg.src = d.photo;
            avatarImg.style.display="block";
            avatarFallback.style.display="none";
        }
        else
        {
            avatarFallback.innerText =
            (d.name || "S").charAt(0).toUpperCase();

            avatarFallback.style.display="flex";
            avatarImg.style.display="none";
        }

    });
}


/*********************************
LOAD VERIFIED CERTIFICATES
*********************************/
function loadCertificates()
{
    db.collection("certificates")
    .where("uid","==",uid)
    .where("status","==","verified")
    .onSnapshot(snapshot =>
    {
        certList.innerHTML = ""; // clear old data

        if(snapshot.empty)
        {
            certList.innerHTML =
            `<div class="empty">
                No verified certificates found
            </div>`;
            return;
        }

        snapshot.forEach(doc =>
        {
            const d = doc.data();

            certList.innerHTML += `

            <div class="cert-card">

                <div class="cert-left">

                    <div class="cert-icon">📄</div>

                    <div class="cert-info">

                        <div class="cert-header">

                            <div class="cert-title">
                                ${d.title || ""}
                            </div>

                        </div>
<div class="cert-tags">

    <span class="tag">${d.skill || ""}</span>

    <span class="tag level-${(d.level || "").toLowerCase()}">
        ${d.level || ""}
    </span>

</div>

                    </div>

                </div>

                <button class="share-btn"
                onclick="shareCert('${doc.id}', '${d.fileURL}')">
                Share
                </button>

            </div>

            `;
        });

    });
}


/*********************************
OPEN SHARE MODAL
*********************************/
function shareCert(certId, fileURL)
{
    const user = auth.currentUser;

    currentCertId = certId;
    currentFileURL = fileURL;

    const link =
    window.location.origin +
    "/frontend/viewer.html?cert=" +
    certId;

    shareLink.value = link;

    // ✅ AUTO CREATE SHARE DOCUMENT IF NOT EXISTS
    db.collection("certificateShares")
    .doc(certId)
    .get()
    .then(doc =>
    {
        if(!doc.exists)
        {
            db.collection("certificateShares")
            .doc(certId)
            .set({
                certId: certId,
                ownerUid: user.uid,
                ownerEmail: user.email,
                accessLevel: "view",
                public: true
            });
        }
    });

    loadAccessLevel();
    loadOwner();
    loadViewers();

    shareModal.classList.add("show");
}
/*********************************
CLOSE MODAL
*********************************/
function closeShareModal()
{
    shareModal.classList.remove("show");
}


/*********************************
COPY LINK
*********************************/
function copyLink()
{
    navigator.clipboard.writeText(shareLink.value);

    const btn = document.querySelector(".copy-btn");

    btn.innerText="Copied!";

    setTimeout(()=>{
        btn.innerText="Copy";
    },1500);
}


/*********************************
EMAIL SHARE
*********************************/
function shareEmail()
{
    window.location.href =
    "mailto:?subject=My SkillVault Certificate&body=" +
    encodeURIComponent(shareLink.value);
}


/*********************************
LINKEDIN SHARE
*********************************/
function shareLinkedIn()
{
    window.open(
    "https://www.linkedin.com/sharing/share-offsite/?url=" +
    encodeURIComponent(shareLink.value),
    "_blank"
    );
}


/*********************************
WHATSAPP SHARE
*********************************/
function shareWhatsApp()
{
    window.open(
    "https://wa.me/?text=" +
    encodeURIComponent(shareLink.value),
    "_blank"
    );
}
async function updateAccessLevel()
{
    try
    {
        const user = auth.currentUser;

        if(!user)
        {
            alert("Please login first");
            return;
        }

        const level =
        document.getElementById("accessLevel").value;

        const certId = currentCertId;

        if(!certId)
        {
            alert("Certificate not found");
            return;
        }

        /* SAVE GLOBAL ACCESS LEVEL */

        await db.collection("certificateShares")
        .doc(certId)
        .set({
            certId: certId,
            ownerUid: user.uid,
            ownerEmail: user.email,
            accessLevel: level,
            public: true
        }, { merge:true });


        /* SAVE OWNER ACCESS IN certificateViews */

        await db.collection("certificateViews")
        .doc(certId + "_" + user.uid)
        .set({
            certId: certId,
            viewerUid: user.uid,
            viewerEmail: user.email,
            accessLevel: level,
            lastViewed:
            firebase.firestore.FieldValue.serverTimestamp()
        }, { merge:true });


        console.log("Access updated to:", level);

        alert("Access level updated to " + level);

    }
    catch(error)
    {
        console.error(error);
        alert("Error updating access level");
    }
}

/*********************************
LOAD ACCESS LEVEL
*********************************/
function loadAccessLevel()
{
    db.collection("certificateShares")
    .doc(currentCertId)
    .get()
    .then(doc =>
    {
        if(doc.exists)
        {
            accessLevelSelect.value =
            doc.data().accessLevel || "view";
        }
        else
        {
            accessLevelSelect.value = "view";
        }
    });
}


/*********************************
TRACK VIEWER
*********************************/
function trackViewer(certId)
{
    auth.onAuthStateChanged(user =>
    {
        if(!user) return;

        const ref =
        db.collection("certificateViews")
        .doc(certId + "_" + user.uid);

        ref.get().then(doc =>
        {
            if(doc.exists)
            {
                ref.update({

                    viewCount:
                    firebase.firestore.FieldValue.increment(1),

                    lastViewed:
                    firebase.firestore.FieldValue.serverTimestamp()

                });
            }
            else
            {
                ref.set({

                    certId: certId,
                    viewerUid: user.uid,
                    viewerEmail: user.email,
                    viewCount: 1,

                    lastViewed:
                    firebase.firestore.FieldValue.serverTimestamp()

                });
            }
        });
    });
}


/*********************************
LOAD VIEWERS LIST
*********************************/
function loadViewers()
{
    if(!currentCertId) return;

    viewerList.innerHTML = "Loading viewers...";

    db.collection("certificateViews")
    .where("certId","==",currentCertId)
    .onSnapshot(snapshot =>
    {
        viewerList.innerHTML = "";

        if(snapshot.empty)
        {
            viewerList.innerHTML =
            "<li>No viewers yet</li>";
            return;
        }

        snapshot.forEach(doc =>
        {
            const v = doc.data();

            const lastViewed =
            v.lastViewed
            ? v.lastViewed.toDate().toLocaleString()
            : "No date";

            const id = doc.id;

            viewerList.innerHTML += `
            <li class="viewer-item">

                <div class="viewer-header"
                     onclick="toggleViewer('${id}')">

                    <span>${v.viewerEmail}</span>

                    <span id="arrow-${id}" class="arrow">▶</span>

                </div>

                <div id="details-${id}"
                     class="viewer-details"
                     style="display:none">

                    Views: ${v.viewCount}<br>
                    Last Viewed: ${lastViewed}

                </div>

            </li>
            `;
        });

    });
}
/*********************************
LOGOUT
*********************************/
function logout()
{
    auth.signOut()
    .then(()=>{
        location.href="login.html";
    });
}
/* Close when clicking outside modal */
shareModal.addEventListener("click", function(e)
{
    if(e.target === shareModal)
    {
        closeShareModal();
    }
});


/* Close when pressing ESC */
document.addEventListener("keydown", function(e)
{
    if(e.key === "Escape")
    {
        closeShareModal();
    }
});
/*********************************
LOAD OWNER
*********************************/
function loadOwner()
{
    const user = auth.currentUser;

    if(!user || !ownerIdElement) return;

    db.collection("certificateShares")
    .doc(currentCertId)
    .get()
    .then(doc =>
    {
        if(doc.exists)
        {
            const data = doc.data();

            ownerIdElement.innerText =
            data.ownerEmail || data.ownerUid;
        }
        else
        {
            ownerIdElement.innerText =
            user.email || user.uid;
        }
    });
}
function toggleViewer(id)
{
    const allDetails =
    document.querySelectorAll(".viewer-details");

    const allArrows =
    document.querySelectorAll(".arrow");

    const currentDetails =
    document.getElementById("details-" + id);

    const currentArrow =
    document.getElementById("arrow-" + id);

    const isOpen =
    currentDetails.style.display === "block";

    // close all
    allDetails.forEach(d => d.style.display = "none");

    allArrows.forEach(a => a.innerText = "▶");

    // open selected if closed
    if(!isOpen)
    {
        currentDetails.style.display = "block";
        currentArrow.innerText = "▼";
    }
}
function checkAccessPermission()
{
    const user = auth.currentUser;

    if(!user) return;

    db.collection("certificateShares")
    .doc(currentCertId)
    .get()
    .then(doc =>
    {
        if(doc.exists)
        {
            const data = doc.data();

            currentOwnerUid = data.ownerUid;
            currentAccessLevel = data.accessLevel || "view";

            // Owner always has full access
            if(user.uid === currentOwnerUid)
            {
                currentAccessLevel = "owner";
            }

            applyRestrictions();
        }
    });
}
