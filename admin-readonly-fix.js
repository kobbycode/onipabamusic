// Quick fix for readonly duration/size fields
// This script removes readonly attribute on page load to allow manual input

document.addEventListener('DOMContentLoaded', function () {
    // Remove readonly from video duration
    const videoDuration = document.getElementById('videoDuration');
    if (videoDuration) {
        videoDuration.removeAttribute('readonly');
        videoDuration.placeholder = "e.g., 5:47 (or auto-detected from file)";
    }

    // Remove readonly from audio duration
    const audioDuration = document.getElementById('audioDuration');
    if (audioDuration) {
        audioDuration.removeAttribute('readonly');
        audioDuration.placeholder = "e.g., 3:35 (or auto-detected from file)";
    }

    // Remove readonly from PDF size
    const pdfSize = document.getElementById('pdfSize');
    if (pdfSize) {
        pdfSize.removeAttribute('readonly');
        pdfSize.placeholder = "e.g., 1.2 MB (or auto-detected from file)";
    }

    console.log('Form fields are now editable');
});
