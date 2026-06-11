// ======================
// FIREBASE CONFIG
// ======================

const firebaseConfig = {
    apiKey: "AIzaSyBFj3ps1nRALcjr77RkU_Tdm6nRFfr4PO4",
    authDomain: "nurse-duty-system.firebaseapp.com",
    projectId: "nurse-duty-system",
   storageBucket:
"nurse-duty-system.firebasestorage.app",
    messagingSenderId: "269066600655",
    appId: "1:269066600655:web:e2a38d93cba4420645f7ba"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const storage =
    firebase.storage();

console.log("Firebase connected");

// ======================
// GLOBALS
// ======================

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ======================
// CREATE ACCOUNT
// ======================

function createAccount() {

    let name =
        document.getElementById("name").value;

    let username =
        document.getElementById("username").value;

    let password =
        document.getElementById("password").value;

    db.collection("nurses")
        .add({
            name: name,
            username: username,
            password: password,
            approved: false,
            createdAt: new Date()
        })

        .then(() => {

            document.getElementById(
                "message"
            ).innerText =
                "Request sent to Admin ✔";
        })

        .catch((error) => {

            console.log(error);

            document.getElementById(
                "message"
            ).innerText =
                "Error saving account";
        });
}

// ======================
// LOGIN
// ======================

function login() {

    let username =
        document.getElementById(
            "username"
        ).value;

    let password =
        document.getElementById(
            "password"
        ).value;

    db.collection("nurses")
        .where("username", "==", username)
        .where("password", "==", password)
        .get()

        .then((snapshot) => {

            if (snapshot.empty) {

                document.getElementById(
                    "message"
                ).innerText =
                    "Wrong username or password";

                return;
            }

            snapshot.forEach((doc) => {

                let nurse =
                    doc.data();

                if (
                    nurse.approved ===
                    false
                ) {

                    document.getElementById(
                        "message"
                    ).innerText =
                        "Waiting for admin approval";

                    return;
                }

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(nurse)
                );

                window.location.href =
                    "nurse-dashboard.html";
            });
        })

        .catch((error) => {

            console.log(error);

            document.getElementById(
                "message"
            ).innerText =
                "Login failed";
        });
}

// ======================
// LOAD NURSES
// ======================

function loadNurses() {

    let nurseList =
        document.getElementById(
            "nurseList"
        );

    let approvedNurseList =
        document.getElementById(
            "approvedNurseList"
        );

    if (
        !nurseList ||
        !approvedNurseList
    ) {
        return;
    }

    let searchInput =
        document.getElementById(
            "searchNurse"
        );

    let searchValue =
        searchInput
            ? searchInput.value.toLowerCase()
            : "";

    nurseList.innerHTML =
        "Loading...";

    approvedNurseList.innerHTML =
        "Loading...";

    db.collection("nurses")
        .get()

        .then((snapshot) => {

            nurseList.innerHTML =
                "";

            approvedNurseList.innerHTML =
                "";

            snapshot.forEach((doc) => {

                let nurse =
                    doc.data();

                let id =
                    doc.id;

                if (
                    !nurse.name
                        .toLowerCase()
                        .includes(searchValue)
                ) {
                    return;
                }

                if (
                    nurse.approved ===
                    false
                ) {

                    nurseList.innerHTML +=
                        `
                        <div>
                            <p>${nurse.name}</p>

                            <button
                                class="approve-btn"
                                onclick="approveNurse('${id}')"
                            >
                                Approve
                            </button>

                            <button
                                class="reject-btn"
                                onclick="removeNurse('${id}')"
                            >
                                Remove
                            </button>
                        </div>
                        `;
                }

                else {

                    approvedNurseList.innerHTML +=
                        `
                        <div>
                            <p>${nurse.name}</p>

                            <button
                                class="reject-btn"
                                onclick="removeNurse('${id}')"
                            >
                                Remove
                            </button>
                        </div>
                        `;
                }
            });
        })

        .catch((error) => {
            console.log(error);
        });
}

// ======================
// APPROVE NURSE
// ======================

function approveNurse(id) {

    db.collection("nurses")
        .doc(id)

        .update({
            approved: true
        })

        .then(() => {

            alert(
                "Nurse approved ✔"
            );

            loadNurses();
            loadStats();
        })

        .catch((error) => {
            console.log(error);
        });
}

// ======================
// REMOVE NURSE
// ======================

function removeNurse(id) {

    let confirmDelete =
        confirm(
            "Remove this nurse?"
        );

    if (!confirmDelete) {
        return;
    }

    db.collection("nurses")
        .doc(id)
        .delete()

        .then(() => {

            alert(
                "Nurse removed ✔"
            );

            loadNurses();
            loadStats();
        });
}

// ======================
// NURSE DASHBOARD
// ======================

function loadNurseDashboard() {

    let user =
        JSON.parse(
            localStorage.getItem(
                "loggedInUser"
            )
        );

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    document.getElementById(
        "welcomeText"
    ).innerText =
        "Welcome " +
        user.name;

    loadBookedDays();
    loadRoster();
    loadNotifications();
}

// ======================
// BOOK DAY OFF
// ======================

function bookDayOff() {

    let user =
        JSON.parse(
            localStorage.getItem(
                "loggedInUser"
            )
        );

    let selectedDate =
        document.getElementById(
            "dayOff"
        ).value;

    if (!selectedDate) {

        document.getElementById(
            "message"
        ).innerText =
            "Choose a date";

        return;
    }

    let selected =
        new Date(selectedDate);

    let selectedMonth =
        selected.getMonth();

    let selectedYear =
        selected.getFullYear();

    // Check if nurse already booked this month
    db.collection("bookings")
    .where(
        "username",
        "==",
        user.username
    )
    .get()

    .then((snapshot) => {

        let alreadyBooked =
            false;

        snapshot.forEach((doc) => {

            let booking =
                doc.data();

            let bookingDate =
                new Date(
                    booking.date
                );

            if (

                bookingDate.getMonth()
                === selectedMonth &&

                bookingDate.getFullYear()
                === selectedYear
            ) {

                alreadyBooked =
                    true;
            }
        });

        if (alreadyBooked) {

            document.getElementById(
                "message"
            ).innerText =
                "You already booked a day this month";

            return Promise.reject(
                "monthly-booking"
            );
        }

        // Check if date already taken
        return db.collection(
            "bookings"
        )
        .where(
            "date",
            "==",
            selectedDate
        )
        .get();
    })

    .then((snapshot) => {

        if (!snapshot.empty) {

            document.getElementById(
                "message"
            ).innerText =
                "This date is already booked";

            return Promise.reject(
                "date-booked"
            );
        }

        // Save booking
        return db.collection(
            "bookings"
        )
        .add({

            name:
                user.name,

            username:
                user.username,

            date:
                selectedDate
        });
    })

    .then(() => {

        document.getElementById(
            "message"
        ).innerText =
            "Day booked successfully ✔";

        loadBookedDays();
    })

    .catch((error) => {

        if (

            error !==
            "monthly-booking" &&

            error !==
            "date-booked"
        ) {

            console.log(error);

            document.getElementById(
                "message"
            ).innerText =
                "Booking failed";
        }
    });
}

// ======================
// LOGOUT
// ======================

function logout() {

    localStorage.removeItem(
        "loggedInUser"
    );

    window.location.href =
        "login.html";
}

// ======================
// LOAD STATS
// ======================

function loadStats() {

    let totalNurses =
        document.getElementById(
            "totalNurses"
        );

    let totalBookings =
        document.getElementById(
            "totalBookings"
        );

    let pendingRequests =
        document.getElementById(
            "pendingRequests"
        );

    // TOTAL NURSES
    db.collection("nurses")
    .get()

    .then((snapshot) => {

        if (totalNurses) {

            totalNurses.innerText =
                snapshot.size;
        }
    });

    // TOTAL BOOKINGS
    db.collection("bookings")
    .get()

    .then((snapshot) => {

        if (totalBookings) {

            totalBookings.innerText =
                snapshot.size;
        }
    });

    // PENDING REQUESTS
    db.collection("requests")
    .get()

    .then((snapshot) => {

        if (pendingRequests) {

            pendingRequests.innerText =
                snapshot.size;
        }
    });
}


// ======================
// LOAD REQUESTS
// ======================

function loadRequests() {

    let requestList =
        document.getElementById(
            "requestList"
        );

    if (!requestList) {
        return;
    }

    requestList.innerHTML =
        "Loading requests...";

    db.collection("requests")
    .get()

    .then((snapshot) => {

        requestList.innerHTML =
            "";

        snapshot.forEach((doc) => {

            let request =
                doc.data();

            let id =
                doc.id;

            requestList.innerHTML +=
            `
            <div style="margin-bottom:20px;">

                <p>
                    ${request.name}
                    → ${request.date}
                </p>

                <button
                    class="approve-btn"
                    onclick="approveRequest('${id}')"
                >
                    Approve
                </button>

                <button
                    class="reject-btn"
                    onclick="rejectRequest('${id}')"
                >
                    Reject
                </button>

            </div>
            `;
        });
    })

    .catch((error) => {

        console.log(error);
    });
}

// ======================
// APPROVE REQUEST
// ======================

function approveRequest(id) {

    db.collection("requests")
    .doc(id)
    .get()

    .then((doc) => {

        let request =
            doc.data();

        return db.collection("bookings")
        .add({

            name:
                request.name,

            username:
                request.username,

            date:
                request.date
        })

        .then(() => {

            return db.collection(
                "notifications"
            )
            .add({

                username:
                    request.username,

                message:
                    "✔ Your extra request was approved"
            });
        })

        .then(() => {

            return db.collection(
                "requests"
            )
            .doc(id)
            .delete();
        });
    })

    .then(() => {

        alert(
            "Request approved ✔"
        );

        loadRequests();
        loadBookedDays();
        loadStats();
        loadBookingCalendar();
    })

    .catch((error) => {

        console.log(error);
    });
}

// ======================
// REJECT REQUEST
// ======================

function rejectRequest(id) {

    db.collection("requests")
    .doc(id)
    .get()

    .then((doc) => {

        let request =
            doc.data();

        return db.collection(
            "notifications"
        )
        .add({

            username:
                request.username,

            message:
                "❌ Your request was rejected"
        })

        .then(() => {

            return db.collection(
                "requests"
            )
            .doc(id)
            .delete();
        });
    })

    .then(() => {

        alert(
            "Request rejected"
        );

        loadRequests();
        loadStats();
    })

    .catch((error) => {

        console.log(error);
    });
}

// ======================
// LOAD CHART
// ======================

function loadChart() {

    let chartCanvas =
        document.getElementById(
            "analyticsChart"
        );

    if (!chartCanvas) {
        return;
    }

    Promise.all([

        db.collection(
            "nurses"
        ).get(),

        db.collection(
            "bookings"
        ).get(),

        db.collection(
            "requests"
        ).get()

    ])

    .then((results) => {

        let nurseCount =
            results[0].size;

        let bookingCount =
            results[1].size;

        let requestCount =
            results[2].size;

        new Chart(chartCanvas, {

            type: "bar",

            data: {

                labels: [
                    "Nurses",
                    "Bookings",
                    "Requests"
                ],

                datasets: [{
                    label:
                        "Hospital Stats",

                    data: [
                        nurseCount,
                        bookingCount,
                        requestCount
                    ]
                }]
            }
        });
    })

    .catch((error) => {

        console.log(error);
    });
}

// ======================
// BOOKING CALENDAR
// ======================

function loadBookingCalendar() {

    let calendar =
        document.getElementById(
            "bookingCalendar"
        );

    let title =
        document.getElementById(
            "calendarTitle"
        );

    if (!calendar) {
        return;
    }

    calendar.innerHTML =
        "";

    const days = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ];

    // Calendar headers
    days.forEach((day) => {

        calendar.innerHTML +=
        `
        <div class="calendar-header">
            ${day}
        </div>
        `;
    });

    let firstDay =
        new Date(
            currentYear,
            currentMonth,
            1
        );

    let startDay =
        firstDay.getDay();

    if (startDay === 0) {
        startDay = 7;
    }

    let daysInMonth =
        new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();

    let monthName =
        firstDay.toLocaleString(
            "default",
            {
                month: "long"
            }
        );

    if (title) {

        title.innerText =
            monthName +
            " " +
            currentYear;
    }

    // Empty spaces before month starts
    for (
        let i = 1;
        i < startDay;
        i++
    ) {

        calendar.innerHTML +=
            `<div></div>`;
    }

    db.collection("bookings")
    .get()

    .then((snapshot) => {

        let bookings = {};

        snapshot.forEach((doc) => {

            let booking =
                doc.data();

            let bookingDate =
                new Date(
                    booking.date
                );

            if (

                bookingDate.getMonth()
                === currentMonth &&

                bookingDate.getFullYear()
                === currentYear
            ) {

                bookings[
                    bookingDate.getDate()
                ] =
                    booking.name;
            }
        });

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            let nurseName =
                bookings[day] || "";

            calendar.innerHTML +=
            `
            <div class="calendar-day ${nurseName ? 'booked-day' : ''}">

                <h4>
                    ${day}
                </h4>

                ${
                    nurseName
                    ?
                    `
                    <div class="booked-name">
                        ${nurseName}
                    </div>
                    `
                    :
                    ""
                }

            </div>
            `;
        }
    })

    .catch((error) => {

        console.log(error);
    });
}

// ======================
// LOAD BOOKED DAYS
// ======================

function loadBookedDays() {

    let bookedDays =
        document.getElementById(
            "bookedDays"
        );

    if (!bookedDays) {
        return;
    }

    bookedDays.innerHTML =
        "Loading...";

    db.collection("bookings")
    .get()

    .then((snapshot) => {

        bookedDays.innerHTML =
            "";

        snapshot.forEach((doc) => {

            let booking =
                doc.data();

            bookedDays.innerHTML +=
                `
                <p>
                    ${booking.name}
                    → ${booking.date}
                </p>
                `;
        });
    })

    .catch((error) => {

        console.log(error);
    });
}


// ======================
// REQUEST EXTRA DAY
// ======================

function requestExtra() {

    let user =
        JSON.parse(
            localStorage.getItem(
                "loggedInUser"
            )
        );

    let selectedDate =
        document.getElementById(
            "dayOff"
        ).value;

    if (!selectedDate) {

        document.getElementById(
            "message"
        ).innerText =
            "Choose a date";

        return;
    }

    db.collection("requests")
    .add({

        name:
            user.name,

        username:
            user.username,

        date:
            selectedDate,

        status:
            "pending"
    })

    .then(() => {

        document.getElementById(
            "message"
        ).innerText =
            "Extra request sent ✔";
    })

    .catch((error) => {

        console.log(error);

        document.getElementById(
            "message"
        ).innerText =
            "Request failed";
    });
}

// ======================
// PREVIOUS MONTH
// ======================

function previousMonth() {

    currentMonth--;

    if (
        currentMonth < 0
    ) {

        currentMonth = 11;
        currentYear--;
    }

    loadBookingCalendar();
}


// ======================
// NEXT MONTH
// ======================

function nextMonth() {

    currentMonth++;

    if (
        currentMonth > 11
    ) {

        currentMonth = 0;
        currentYear++;
    }

    loadBookingCalendar();
}

// ======================
// LOAD DUTY ROSTER
// ======================

https://i.postimg.cc/YC6wKKH1/b551c210-8459-4bc4-8184-7cc57b2cfa90-(1).jpg

// ======================
// UPLOAD ROSTER
// ======================

function uploadRoster() {

    let link =
        document.getElementById(
            "rosterLink"
        ).value;

    if (!link) {

        document.getElementById(
            "uploadMessage"
        ).innerText =
            "Paste a link";

        return;
    }

    let fileType =
        link.includes(".pdf")
        ? "application/pdf"
        : "image";

    db.collection("settings")
    .doc("dutyRoster")
    .set({

        link: link,
        type: fileType
    })

    .then(() => {

        document.getElementById(
            "uploadMessage"
        ).innerText =
            "Roster uploaded ✔";

        loadRoster();
    })

    .catch((error) => {

        console.log(error);


        document.getElementById(
            "uploadMessage"
        ).innerText =
            "Upload failed";
    });
}

// ======================
// LOAD NOTIFICATIONS
// ======================

function loadRoster() {

    let rosterSection =
        document.getElementById(
            "rosterSection"
        );

    if (!rosterSection) {
        return;
    }

    db.collection("settings")
    .doc("dutyRoster")
    .get()

    .then((doc) => {

        if (!doc.exists) {

            rosterSection.innerHTML =
                "No roster uploaded";

            return;
        }

        let data =
            doc.data();

        rosterSection.innerHTML =
        `
        <img
            src="${data.link}"
            width="100%"
        >
        `;
    })

    .catch((error) => {

        console.log(error);
    });
}

// ======================
// ADMIN LOGIN
// ======================

function adminLogin() {

    let username =
        document.getElementById(
            "adminUsername"
        ).value;

    let password =
        document.getElementById(
            "adminPassword"
        ).value;

    if (

        username === "admin" &&

        password === "admin123"
    ) {

        window.location.href =
            "admin-dashboard.html";
    }

    else {

        document.getElementById(
            "message"
        ).innerText =
            "Wrong admin login";
    }
}

// ======================
// DARK MODE
// ======================

function toggleDarkMode() {

    document.body.classList.toggle(
        "dark-mode"
    );

    // Save mode
    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        localStorage.setItem(
            "theme",
            "dark"
        );
    }

    else {

        localStorage.setItem(
            "theme",
            "light"
        );
    }
}

// Load saved mode
window.onload = function () {

    let savedTheme =
        localStorage.getItem(
            "theme"
        );

    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );
    }
};