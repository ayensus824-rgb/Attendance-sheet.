// --- Initial Default Database ---
const defaultStudents = [
    { id: '1', roll: '101', name: 'Alice Johnson', class: 'Grade 10-A', gender: 'Female', contact: '+1 (555) 019-2834' },
    { id: '2', roll: '102', name: 'Benjamin Smith', class: 'Grade 10-A', gender: 'Male', contact: '+1 (555) 019-4921' },
    { id: '3', roll: '103', name: 'Chloe Davis', class: 'Grade 10-A', gender: 'Female', contact: '+1 (555) 019-8832' },
    { id: '4', roll: '104', name: 'Daniel Martinez', class: 'Grade 10-A', gender: 'Male', contact: '+1 (555) 019-1102' },
    { id: '5', roll: '105', name: 'Emma Wilson', class: 'Grade 10-A', gender: 'Female', contact: '+1 (555) 019-9945' },
    { id: '6', roll: '201', name: 'Ethan Brown', class: 'Grade 10-B', gender: 'Male', contact: '+1 (555) 028-3321' },
    { id: '7', roll: '202', name: 'Fiona Garcia', class: 'Grade 10-B', gender: 'Female', contact: '+1 (555) 028-4455' },
    { id: '8', roll: '301', name: 'Gabriel Taylor', class: 'Grade 11-Science', gender: 'Male', contact: '+1 (555) 037-9911' }
];

// --- State Management ---
let students = JSON.parse(localStorage.getItem('edu_students')) || defaultStudents;
let attendanceRecords = JSON.parse(localStorage.getItem('edu_attendance')) || {}; 
// Structure: { "Grade 10-A": { "2026-10-07": { "1": { status: "Present", remark: "" }, ... } } }

let currentClass = 'Grade 10-A';
let currentDate = getTodayDateString();

function getTodayDateString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// --- DOM Elements ---
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const globalClassSelect = document.getElementById('global-class-select');
const attendanceDateInput = document.getElementById('attendance-date');
const attendanceTbody = document.getElementById('attendance-tbody');
const studentsTbody = document.getElementById('students-tbody');
const studentSearchInput = document.getElementById('student-search');

// Modal Elements
const studentModal = document.getElementById('student-modal');
const btnOpenAddStudent = document.getElementById('btn-open-add-student');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const studentForm = document.getElementById('student-form');
const modalTitle = document.getElementById('modal-title');
const editStudentId = document.getElementById('edit-student-id');
const modalRoll = document.getElementById('modal-roll');
const modalName = document.getElementById('modal-name');
const modalClass = document.getElementById('modal-class');
const modalGender = document.getElementById('modal-gender');
const modalContact = document.getElementById('modal-contact');

// Action Buttons
const btnMarkAllPresent = document.getElementById('btn-mark-all-present');
const btnSaveAttendance = document.getElementById('btn-save-attendance');
const btnExportExcel = document.getElementById('btn-export-excel');
const exportFormat = document.getElementById('export-format');
const exportDate = document.getElementById('export-date');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statPresent = document.getElementById('stat-present');
const statAbsent = document.getElementById('stat-absent');
const statLate = document.getElementById('stat-late');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    attendanceDateInput.value = currentDate;
    exportDate.value = currentDate;
    globalClassSelect.value = currentClass;
    
    updateHeaderDateDisplay();
    renderAttendanceTable();
    renderStudentsTable();
    updateReportsStats();

    // Event Listeners
    initNavigation();
    initGlobalControls();
    initAttendanceActions();
    initStudentModalActions();
    initExportAction();
});

// --- Navigation Tabs ---
function initNavigation() {
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            const targetTab = document.getElementById(item.getAttribute('data-tab'));
            targetTab.classList.add('active');

            if (item.getAttribute('data-tab') === 'reports-tab') {
                updateReportsStats();
            }
        });
    });
}

function updateHeaderDateDisplay() {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateObj = new Date(currentDate + 'T00:00:00');
    document.getElementById('current-date-display').textContent = `Active Date: ${dateObj.toLocaleDateString('en-US', options)}`;
}

// --- Global Controls ---
function initGlobalControls() {
    globalClassSelect.addEventListener('change', (e) => {
        currentClass = e.target.value;
        modalClass.value = currentClass;
        renderAttendanceTable();
        renderStudentsTable();
        updateReportsStats();
    });

    attendanceDateInput.addEventListener('change', (e) => {
        currentDate = e.target.value;
        updateHeaderDateDisplay();
        renderAttendanceTable();
    });
}

// --- Attendance Management ---
function renderAttendanceTable() {
    attendanceTbody.innerHTML = '';
    const classStudents = students.filter(s => s.class === currentClass);

    if (classStudents.length === 0) {
        attendanceTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">No students registered in ${currentClass}. Add students in the 'Students List' tab.</td></tr>`;
        updateAttendanceMetrics([]);
        return;
    }

    // Retrieve saved records for class & date
    const classRecords = (attendanceRecords[currentClass] && attendanceRecords[currentClass][currentDate]) || {};

    classStudents.forEach(student => {
        const record = classRecords[student.id] || { status: 'Present', remark: '' };
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${student.roll}</strong></td>
            <td>${student.name}</td>
            <td>${student.gender}</td>
            <td>
                <div class="attendance-pills">
                    <label class="pill-option present-pill ${record.status === 'Present' ? 'active' : ''}">
                        <input type="radio" name="status_${student.id}" value="Present" ${record.status === 'Present' ? 'checked' : ''} onchange="updateAttendanceStatus('${student.id}', 'Present')">
                        <span>Present</span>
                    </label>
                    <label class="pill-option absent-pill ${record.status === 'Absent' ? 'active' : ''}">
                        <input type="radio" name="status_${student.id}" value="Absent" ${record.status === 'Absent' ? 'checked' : ''} onchange="updateAttendanceStatus('${student.id}', 'Absent')">
                        <span>Absent</span>
                    </label>
                    <label class="pill-option late-pill ${record.status === 'Late' ? 'active' : ''}">
                        <input type="radio" name="status_${student.id}" value="Late" ${record.status === 'Late' ? 'checked' : ''} onchange="updateAttendanceStatus('${student.id}', 'Late')">
                        <span>Late</span>
                    </label>
                </div>
            </td>
            <td>
                <input type="text" class="remark-input" placeholder="Add note..." value="${record.remark || ''}" oninput="updateAttendanceRemark('${student.id}', this.value)">
            </td>
        `;
        attendanceTbody.appendChild(tr);
    });

    updateAttendanceMetrics(classStudents);
}

window.updateAttendanceStatus = function(studentId, status) {
    saveRecordState(studentId, status, null);
    renderAttendanceTable();
};

window.updateAttendanceRemark = function(studentId, remark) {
    saveRecordState(studentId, null, remark);
};

function saveRecordState(studentId, status, remark) {
    if (!attendanceRecords[currentClass]) attendanceRecords[currentClass] = {};
    if (!attendanceRecords[currentClass][currentDate]) attendanceRecords[currentClass][currentDate] = {};
    if (!attendanceRecords[currentClass][currentDate][studentId]) {
        attendanceRecords[currentClass][currentDate][studentId] = { status: 'Present', remark: '' };
    }

    if (status !== null) attendanceRecords[currentClass][currentDate][studentId].status = status;
    if (remark !== null) attendanceRecords[currentClass][currentDate][studentId].remark = remark;
}

function updateAttendanceMetrics(classStudents) {
    const classRecords = (attendanceRecords[currentClass] && attendanceRecords[currentClass][currentDate]) || {};
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    classStudents.forEach(student => {
        const rec = classRecords[student.id];
        const status = rec ? rec.status : 'Present'; // Default state is Present
        if (status === 'Present') presentCount++;
        else if (status === 'Absent') absentCount++;
        else if (status === 'Late') lateCount++;
    });

    statTotal.textContent = classStudents.length;
    statPresent.textContent = presentCount;
    statAbsent.textContent = absentCount;
    statLate.textContent = lateCount;
}

function initAttendanceActions() {
    btnMarkAllPresent.addEventListener('click', () => {
        const classStudents = students.filter(s => s.class === currentClass);
        if (!attendanceRecords[currentClass]) attendanceRecords[currentClass] = {};
        if (!attendanceRecords[currentClass][currentDate]) attendanceRecords[currentClass][currentDate] = {};

        classStudents.forEach(student => {
            if (!attendanceRecords[currentClass][currentDate][student.id]) {
                attendanceRecords[currentClass][currentDate][student.id] = { status: 'Present', remark: '' };
            } else {
                attendanceRecords[currentClass][currentDate][student.id].status = 'Present';
            }
        });

        renderAttendanceTable();
        showToast('All students marked Present for today');
    });

    btnSaveAttendance.addEventListener('click', () => {
        localStorage.setItem('edu_attendance', JSON.stringify(attendanceRecords));
        showToast('Attendance successfully saved to storage!');
    });
}

// --- Student Management & Modal ---
function renderStudentsTable(filterText = '') {
    studentsTbody.innerHTML = '';
    const filtered = students.filter(s => 
        s.class === currentClass && 
        (s.name.toLowerCase().includes(filterText.toLowerCase()) || s.roll.toLowerCase().includes(filterText.toLowerCase()))
    );

    if (filtered.length === 0) {
        studentsTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No student records found.</td></tr>`;
        return;
    }

    filtered.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${student.roll}</strong></td>
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${student.gender}</td>
            <td>${student.contact || 'N/A'}</td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="openEditStudentModal('${student.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger-light btn-sm" onclick="deleteStudent('${student.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        studentsTbody.appendChild(tr);
    });
}

studentSearchInput.addEventListener('input', (e) => {
    renderStudentsTable(e.target.value);
});

function initStudentModalActions() {
    btnOpenAddStudent.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Student';
        editStudentId.value = '';
        modalRoll.value = '';
        modalName.value = '';
        modalClass.value = currentClass;
        modalGender.value = 'Female';
        modalContact.value = '';
        studentModal.classList.add('active');
    });

    const closeModal = () => studentModal.classList.remove('active');
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editStudentId.value;
        const roll = modalRoll.value.trim();
        const name = modalName.value.trim();
        const sClass = modalClass.value;
        const gender = modalGender.value;
        const contact = modalContact.value.trim();

        if (id) {
            // Edit existing
            const index = students.findIndex(s => s.id === id);
            if (index !== -1) {
                students[index] = { id, roll, name, class: sClass, gender, contact };
            }
            showToast('Student details updated');
        } else {
            // Add new
            const newStudent = {
                id: Date.now().toString(),
                roll,
                name,
                class: sClass,
                gender,
                contact
            };
            students.push(newStudent);
            showToast('New student registered');
        }

        localStorage.setItem('edu_students', JSON.stringify(students));
        closeModal();
        renderStudentsTable();
        renderAttendanceTable();
        updateReportsStats();
    });
}

window.openEditStudentModal = function(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    modalTitle.textContent = 'Edit Student Details';
    editStudentId.value = student.id;
    modalRoll.value = student.roll;
    modalName.value = student.name;
    modalClass.value = student.class;
    modalGender.value = student.gender;
    modalContact.value = student.contact;
    studentModal.classList.add('active');
};

window.deleteStudent = function(id) {
    if (confirm('Are you sure you want to remove this student?')) {
        students = students.filter(s => s.id !== id);
        localStorage.setItem('edu_students', JSON.stringify(students));
        renderStudentsTable();
        renderAttendanceTable();
        updateReportsStats();
        showToast('Student record removed');
    }
};

// --- Reports & Excel (CSV) Export ---
function updateReportsStats() {
    document.getElementById('report-class-name').textContent = currentClass;
    const classStudents = students.filter(s => s.class === currentClass);
    document.getElementById('report-total-students').textContent = classStudents.length;

    const classRecs = attendanceRecords[currentClass] || {};
    document.getElementById('report-logged-days').textContent = Object.keys(classRecs).length;
}

exportFormat.addEventListener('change', (e) => {
    const dateGroup = document.getElementById('export-date-group');
    if (e.target.value === 'summary') {
        dateGroup.style.display = 'none';
    } else {
        dateGroup.style.display = 'flex';
    }
});

function initExportAction() {
    btnExportExcel.addEventListener('click', () => {
        const mode = exportFormat.value;
        const classStudents = students.filter(s => s.class === currentClass);

        if (classStudents.length === 0) {
            alert('No students found for this class to export.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        let filename = '';

        if (mode === 'daily') {
            const targetDate = exportDate.value || currentDate;
            filename = `${currentClass}_Attendance_${targetDate}.csv`;
            
            csvContent += `School Attendance Register\n`;
            csvContent += `Class:,${currentClass}\n`;
            csvContent += `Date:,${targetDate}\n\n`;
            csvContent += `Roll Number,Student Name,Gender,Status,Remarks\n`;

            const classRecs = (attendanceRecords[currentClass] && attendanceRecords[currentClass][targetDate]) || {};

            classStudents.forEach(student => {
                const rec = classRecs[student.id] || { status: 'Present', remark: '' };
                const row = [
                    `"${student.roll}"`,
                    `"${student.name}"`,
                    `"${student.gender}"`,
                    `"${rec.status}"`,
                    `"${(rec.remark || '').replace(/"/g, '""')}"`
                ];
                csvContent += row.join(",") + "\n";
            });

        } else if (mode === 'summary') {
            filename = `${currentClass}_Attendance_Summary.csv`;

            csvContent += `Class Aggregate Attendance Summary\n`;
            csvContent += `Class:,${currentClass}\n`;
            csvContent += `Total Enrolled:,${classStudents.length}\n\n`;
            csvContent += `Roll Number,Student Name,Total Days Logged,Present Count,Absent Count,Late Count\n`;

            const classRecs = attendanceRecords[currentClass] || {};
            const allDates = Object.keys(classRecs);

            classStudents.forEach(student => {
                let pCount = 0, aCount = 0, lCount = 0, loggedDays = 0;

                allDates.forEach(date => {
                    if (classRecs[date][student.id]) {
                        loggedDays++;
                        const st = classRecs[date][student.id].status;
                        if (st === 'Present') pCount++;
                        else if (st === 'Absent') aCount++;
                        else if (st === 'Late') lCount++;
                    }
                });

                const row = [
                    `"${student.roll}"`,
                    `"${student.name}"`,
                    loggedDays,
                    pCount,
                    aCount,
                    lCount
                ];
                csvContent += row.join(",") + "\n";
            });
        }

        // Trigger CSV download compatible with Excel
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Excel-compatible CSV file downloaded successfully!');
    });
}

// --- Toast Notification Helper ---
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}