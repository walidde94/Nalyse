import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export analysis data to PDF.
 *
 * Strategy:
 * 1. Chart images are captured on the main thread (requires DOM access via html2canvas)
 * 2. PDF document construction is offloaded to a Web Worker
 * 3. Progress callbacks report generation status
 * 4. Falls back to main-thread generation if Worker unavailable
 *
 * @param data - Analysis result data
 * @param title - Report title
 * @param onProgress - Optional progress callback (0-100)
 */
export const exportToPDF = async (data: any, title: string, onProgress?: (pct: number) => void) => {
    try {
        onProgress?.(5);

        // Step 1: Capture chart images on main thread (requires DOM)
        const chartImages: Array<{ title: string; dataUrl: string }> = [];

        if (data.options && data.options.length > 0) {
            for (let i = 0; i < data.options.length; i++) {
                const chartId = `chart-${i}`;
                const chartElement = document.getElementById(chartId);
                if (chartElement) {
                    const canvas = await html2canvas(chartElement, {
                        scale: 2,
                        backgroundColor: '#161b22'
                    });
                    chartImages.push({
                        title: data.options[i].title || `Chart ${i + 1}`,
                        dataUrl: canvas.toDataURL('image/png')
                    });
                }
                onProgress?.(5 + ((i + 1) / data.options.length) * 15);
            }
        }

        onProgress?.(20);

        // Step 2: Try Web Worker for PDF construction
        if (typeof Worker !== 'undefined') {
            try {
                await generatePDFViaWorker(data, title, chartImages, onProgress);
                return;
            } catch (workerError) {
                console.warn('PDF Worker failed, falling back to main thread:', workerError);
            }
        }

        // Step 3: Fallback — main thread generation
        await generatePDFMainThread(data, title, chartImages, onProgress);

    } catch (e) {
        console.error('Pro PDF Export Failed', e);
        alert('Failed to generate Professional PDF. Please try again.');
    }
};

/**
 * Generate PDF via Web Worker (non-blocking)
 */
function generatePDFViaWorker(
    data: any,
    title: string,
    chartImages: Array<{ title: string; dataUrl: string }>,
    onProgress?: (pct: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(
            new URL('./pdfWorker.ts', import.meta.url),
            { type: 'module' }
        );

        const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error('PDF worker timed out'));
        }, 60000); // 60s timeout

        worker.onmessage = (event) => {
            const msg = event.data;

            if (msg.type === 'progress') {
                onProgress?.(20 + msg.value * 0.8); // Scale worker progress to 20-100%
            } else if (msg.type === 'complete') {
                clearTimeout(timeout);
                const blob = new Blob([msg.buffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = msg.filename;
                a.click();
                URL.revokeObjectURL(url);
                onProgress?.(100);
                worker.terminate();
                resolve();
            } else if (msg.type === 'error') {
                clearTimeout(timeout);
                worker.terminate();
                reject(new Error(msg.message));
            }
        };

        worker.onerror = (err) => {
            clearTimeout(timeout);
            worker.terminate();
            reject(err);
        };

        worker.postMessage({ data, title, chartImages });
    });
}

/**
 * Fallback: Generate PDF on the main thread
 */
async function generatePDFMainThread(
    data: any,
    title: string,
    chartImages: Array<{ title: string; dataUrl: string }>,
    onProgress?: (pct: number) => void
) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    const brandRgb = { r: 99, g: 102, b: 241 };
    const borderColor = '#e2e8f0';
    const lightGray = '#f8fafc';

    const addHeader = (isFirstPage = false) => {
        doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
        doc.rect(0, 0, pageWidth, 5, 'F');
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 5, pageWidth, 25, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
        doc.text("Nalyse", margin, 22);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(dateStr, pageWidth - margin, 18, { align: "right" });
        doc.text("Automated Intelligence Report", pageWidth - margin, 23, { align: "right" });
        doc.setDrawColor(borderColor);
        doc.setLineWidth(0.5);
        doc.line(margin, 32, pageWidth - margin, 32);
        y = 45;
    };

    const addFooter = (pageNo: number) => {
        const footerY = pageHeight - 15;
        doc.setDrawColor(borderColor);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${pageNo}`, pageWidth / 2, footerY + 2, { align: "center" });
        doc.text("Nalyse confidential • Generated automatically", pageWidth - margin, footerY + 2, { align: "right" });
    };

    addHeader(true);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(30);
    doc.text("Analysis Report", margin, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text("Strategic insights and key performance metrics.", margin, y);
    y += 20;

    onProgress?.(30);

    // Executive Summary Cards
    const summaryData = [
        { label: "Total Rows", value: data.summary?.rows?.toLocaleString() || '0' },
        { label: "Columns", value: data.summary?.columns?.toString() || '0' },
        { label: "Data Score", value: (data.dataHealth?.score || 0) + '%' }
    ];

    let xOffset = margin;
    const cardGap = 10;
    const boxWidth = (pageWidth - (margin * 2) - (cardGap * 2)) / 3;
    const boxHeight = 30;

    summaryData.forEach((item) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(220);
        doc.setLineWidth(0.2);
        doc.roundedRect(xOffset, y, boxWidth, boxHeight, 3, 3, 'FD');
        doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
        doc.rect(xOffset, y, 2, boxHeight, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(item.label.toUpperCase(), xOffset + 10, y + 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(30);
        doc.text(item.value, xOffset + 10, y + 22);
        xOffset += boxWidth + cardGap;
    });
    y += 45;

    onProgress?.(50);

    // Key Findings
    if (data.keyFindings && data.keyFindings.length > 0) {
        doc.setFillColor(lightGray);
        doc.roundedRect(margin, y, pageWidth - (margin * 2), 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
        doc.setFont("helvetica", "bold");
        doc.text("STRATEGIC FINDINGS", margin + 5, y + 7);
        y += 20;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(50);

        data.keyFindings.slice(0, 5).forEach((finding: any) => {
            const text = (finding.description || '').replace(/\*\*/g, '').replace(/^💡\s*/, '');
            const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - 15);
            if (y + (splitText.length * 5) > pageHeight - 30) {
                addFooter(doc.getCurrentPageInfo().pageNumber);
                doc.addPage();
                addHeader();
            }
            doc.setFillColor(234, 179, 8);
            doc.circle(margin + 2, y - 1, 1.5, 'F');
            doc.text(splitText, margin + 10, y);
            y += (splitText.length * 5) + 8;
        });
    }

    y += 10;

    onProgress?.(70);

    // Charts
    if (chartImages.length > 0) {
        if (y > pageHeight - 80) {
            addFooter(doc.getCurrentPageInfo().pageNumber);
            doc.addPage();
            addHeader();
        }

        doc.setFillColor(lightGray);
        doc.roundedRect(margin, y, pageWidth - (margin * 2), 10, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
        doc.setFont("helvetica", "bold");
        doc.text("VISUALIZATIONS & CHARTS", margin + 5, y + 7);
        y += 20;

        chartImages.forEach((chart, i) => {
            const imgH = 90;
            const imgW = pageWidth - (margin * 2);
            if (y + imgH + 20 > pageHeight - 30) {
                addFooter(doc.getCurrentPageInfo().pageNumber);
                doc.addPage();
                addHeader();
            }
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(chart.title || `Chart ${i + 1}`, margin, y - 2);
            doc.addImage(chart.dataUrl, 'PNG', margin, y, imgW, imgH);
            y += imgH + 20;
        });
    }

    addFooter(doc.getCurrentPageInfo().pageNumber);
    onProgress?.(95);

    doc.save(`${title.replace(/\s+/g, '_')}_Pro_Report.pdf`);
    onProgress?.(100);
}
