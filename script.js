// Splash transition
setTimeout(() => {
  document.getElementById('splash').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}, 2000);

// Theme toggle
document.getElementById('themeToggle').onclick = () => {
  document.body.classList.toggle('light-mode');
};

// Camera selector
const cameraSelect = document.getElementById('cameraSelect');
let selectedCameraId = null;

navigator.mediaDevices.enumerateDevices().then(devices => {
  const videoDevices = devices.filter(d => d.kind === 'videoinput');
  videoDevices.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.text = device.label || `Camera ${index + 1}`;
    cameraSelect.appendChild(option);
  });
});

cameraSelect.onchange = () => {
  selectedCameraId = cameraSelect.value;
};

let scanner = null;
document.getElementById('startScan').onclick = () => {
  if (scanner) scanner.clear();
  scanner = new Html5Qrcode("scanner");
  scanner.start(
    selectedCameraId || { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    qrCodeMessage => handleScan(qrCodeMessage),
    error => {}
  );
};

document.getElementById('stopScan').onclick = () => {
  if (scanner) {
    scanner.stop().then(() => {
      scanner.clear();
    }).catch(err => console.error("Stop failed", err));
  }
};

const logTable = document.querySelector("#logTable tbody");
const attendanceData = [];
const scannedRecords = {}; // Tracks student data and timestamps

function handleScan(data) {
  try {
    const parsed = JSON.parse(data);
    const now = new Date().toLocaleTimeString();
    const id = parsed.id;

    if (!scannedRecords[id]) {
      // First scan: create record and row
      scannedRecords[id] = {
        name: parsed.name,
        address: parsed.address,
        section: parsed.section,
        timeIn: now,
        timeOut: null,
        rowElement: null
      };

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${parsed.name}</td>
        <td>${id}</td>
        <td>${parsed.address}</td>
        <td>${parsed.section}</td>
        <td>${now}</td>
        <td></td>
      `;
      logTable.appendChild(row);
      scannedRecords[id].rowElement = row;

      attendanceData.push({
        Name: parsed.name,
        ID: id,
        Address: parsed.address,
        Section: parsed.section,
        TimeIn: now,
        TimeOut: ""
      });

    } else if (!scannedRecords[id].timeOut) {
      // Second scan: update Time Out
      scannedRecords[id].timeOut = now;
      const row = scannedRecords[id].rowElement;
      row.cells[5].textContent = now;

      // Update export data
      const record = attendanceData.find(r => r.ID === id);
      if (record) record.TimeOut = now;

    } else {
      alert(`Student ID ${id} already scanned for both Time In and Time Out.`);
    }

  } catch (e) {
    console.error("Invalid QR format", e);
  }
}

document.getElementById("exportBtn").onclick = () => {
  const filename = document.getElementById("filenameInput").value.trim() || `attendance_${Date.now()}`;
  const ws = XLSX.utils.json_to_sheet(attendanceData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

