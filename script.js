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

const logTable = document.querySelector("#logTable tbody");
const attendanceData = [];

function handleScan(data) {
  try {
    const parsed = JSON.parse(data);
    const now = new Date().toLocaleTimeString();
    const row = document.createElement("tr");

    [parsed.name, parsed.id, parsed.address, parsed.section, now].forEach(val => {
      const cell = document.createElement("td");
      cell.textContent = val;
      row.appendChild(cell);
    });

    logTable.appendChild(row);
    attendanceData.push({
      Name: parsed.name,
      ID: parsed.id,
      Address: parsed.address,
      Section: parsed.section,
      Time: now
    });
  } catch (e) {
    console.error("Invalid QR format", e);
  }
}

// Export to Excel
document.getElementById("exportBtn").onclick = () => {
  const ws = XLSX.utils.json_to_sheet(attendanceData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `attendance_${Date.now()}.xlsx`);
};
