document.addEventListener('DOMContentLoaded', function() {
    const html5QrCode = new Html5Qrcode("qr-reader");
    const startScanBtn = document.getElementById('start-scan-btn');
    const stopScanBtn = document.getElementById('stop-scan-btn');
    const qrReader = document.getElementById('qr-reader');

    let isScanning = false;

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`QR Code content: ${decodedText}`);
        document.getElementById("scan-result").innerText = `Scanned QR Code: ${decodedText}`;
        
        // Optionally, stop scanning after successful scan
        // stopScanning();
    };

    const onScanError = (errorMessage) => {
        console.error(`QR Code Scan Error: ${errorMessage}`);
    };

    function startScanning() {
        qrReader.style.display = 'block';
        startScanBtn.style.display = 'none';
        stopScanBtn.style.display = 'inline-block';

        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: 250
            },
            onScanSuccess,
            onScanError
        ).catch((err) => {
            console.error("Error starting the QR code scanner:", err);
            alert("Error starting the QR code scanner. Please check if your camera is available.");
            stopScanning();
        });

        isScanning = true;
    }

    function stopScanning() {
        if (isScanning) {
            html5QrCode.stop().then(() => {
                qrReader.style.display = 'none';
                startScanBtn.style.display = 'inline-block';
                stopScanBtn.style.display = 'none';
                isScanning = false;
            }).catch((err) => {
                console.error("Error stopping the QR code scanner:", err);
            });
        }
    }

    // Event Listeners
    startScanBtn.addEventListener('click', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);
});