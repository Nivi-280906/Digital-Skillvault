/*********************************
 FIREBASE INIT
*********************************/
const auth = firebase.auth();
const db = firebase.firestore();

let allCertificates = [];


/*********************************
 AUTH STATE CHECK
*********************************/
auth.onAuthStateChanged(user =>
{
  if (!user)
  {
    window.location.href = "login.html";
    return;
  }

  loadCertificates(user.uid);
});


/*********************************
 LOAD CERTIFICATES
*********************************/
function loadCertificates(uid)
{
  db.collection("certificates")
    .where("uid", "==", uid)
    .onSnapshot(snapshot =>
    {
      const container =
        document.getElementById("certContainer");

      if (!container) return;

      allCertificates = [];

      snapshot.forEach(doc =>
      {
        allCertificates.push({
          id: doc.id,
          ...doc.data()
        });
      });

      renderCertificates();
    },
    error =>
    {
      console.error(error);
    });
}


/*********************************
 RENDER CERTIFICATES
*********************************/
function renderCertificates()
{
  const container = document.getElementById("certContainer");
  if (!container) return;

  const search =
    document.getElementById("searchInput")
    ?.value.toLowerCase() || "";

  const filter =
    document.getElementById("statusFilter")
    ?.value || "all";

  container.innerHTML = "";

  if (allCertificates.length === 0)
  {
    container.innerHTML =
      "<p>No certificates uploaded yet.</p>";
    return;
  }

  allCertificates.forEach(d =>
  {
    /******** STATUS ********/
    let statusText = "Processing";
    let statusClass = "processing";

    if (d.status === "verified")
    {
      statusText = "Verified";
      statusClass = "verified";
    }
    else if (d.status === "rejected")
    {
      statusText = "Rejected";
      statusClass = "rejected";
    }

    /******** FILTER ********/
    if (filter !== "all" && statusClass !== filter)
      return;

    /******** SEARCH ********/
    if (!d.title?.toLowerCase().includes(search))
      return;

    /******** DATE ********/
    const date =
      d.createdAt
      ? d.createdAt.toDate().toLocaleDateString()
      : "Just now";

    /******** REJECTION FEEDBACK (CLEAN TOGGLE) ********/
    let rejectionHTML = "";

    if (statusClass === "rejected")
    {
      rejectionHTML = `
        <button class="feedback-toggle"
          onclick="toggleFeedback('fb-${d.id}')">
          ⚠ View Verification Feedback
        </button>

        <div id="fb-${d.id}" class="feedback-box hidden">

          We couldn't verify this certificate.

          <strong>Issue found:</strong>
          <div class="feedback-issue">
            ${d.rejectionReason || "Certificate does not meet verification standards."}
          </div>

          <strong>What you can do:</strong>
          <div class="feedback-help">
            Upload a clear certificate showing your name, course title, completion date, and issuing organization.
          </div>

        </div>
      `;
    }

    /******** CARD ********/
    container.innerHTML += `
      <div class="cert-card">

        <div class="cert-top">
          <div class="doc-icon">📄</div>
          <span class="status ${statusClass}">
            ${statusText}
          </span>
        </div>

        <h3 class="cert-title">
          ${d.title || "Untitled"}
        </h3>

        <div class="tags">
          <span class="tag">${d.skill || "-"}</span>
          <span class="tag level">${d.level || "-"}</span>
        </div>

        <div class="meta">
          Uploaded on ${date}
        </div>

        ${rejectionHTML}

        <div class="actions">
          <button class="view-btn"
            onclick="openModal('${d.file}')">
            View PDF
          </button>

          ${
            statusClass !== "verified"
            ? `<button class="del-btn"
                 onclick="deleteCertificate('${d.id}')">
                 Delete
               </button>`
            : ""
          }
        </div>

      </div>
    `;
  });

  if (container.innerHTML === "")
  {
    container.innerHTML =
      "<p>No matching certificates found.</p>";
  }
}


/*********************************
 TOGGLE FEEDBACK
*********************************/
function toggleFeedback(id)
{
  const element = document.getElementById(id);
  if (!element) return;

  element.classList.toggle("hidden");
}


/*********************************
 DELETE CERTIFICATE
*********************************/
function deleteCertificate(certId)
{
  if (!confirm("Delete this certificate?")) return;

  db.collection("certificates")
    .doc(certId)
    .delete()
    .then(() =>
    {
      alert("Certificate deleted.");
    });
}


/*********************************
 OPEN PDF
*********************************/
function openModal(fileUrl)
{
  document.getElementById("pdfFrame").src = fileUrl;
  document.getElementById("pdfModal").style.display = "flex";
}


/*********************************
 CLOSE PDF
*********************************/
function closeModal()
{
  document.getElementById("pdfModal").style.display = "none";
  document.getElementById("pdfFrame").src = "";
}


/*********************************
 PORTFOLIO
*********************************/
function openPortfolio()
{
  const user = auth.currentUser;
  if (!user) return;

  window.location.href =
    "portfolio.html?uid=" + user.uid;
}


/*********************************
 LOGOUT
*********************************/
function logout()
{
  auth.signOut().then(() =>
  {
    window.location.href = "login.html";
  });
}


/*********************************
 SEARCH + FILTER EVENTS
*********************************/
document.addEventListener("DOMContentLoaded", () =>
{
  document.getElementById("searchInput")
    ?.addEventListener("input", renderCertificates);

  document.getElementById("statusFilter")
    ?.addEventListener("change", renderCertificates);
});
