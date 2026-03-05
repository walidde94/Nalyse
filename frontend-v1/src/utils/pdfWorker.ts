/**
 * PDF Export Worker — Offloads heavy jsPDF document construction
 *
 * The worker builds the PDF structure (header, footer, text sections,
 * executive summary cards, findings) from serialized data.
 * Chart images are pre-captured on the main thread and passed as
 * base64 data URLs.
 *
 * This prevents the main thread from blocking during PDF generation.
 */

import jsPDF from 'jspdf';

interface PDFWorkerPayload {
    data: any;
    title: string;
    chartImages: Array<{ title: string; dataUrl: string }>;
}

// Listen for messages from main thread
self.onmessage = (event: MessageEvent<PDFWorkerPayload>) => {
    const { data, title, chartImages } = event.data;

    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let y = margin;

        // Brand Colors
        const brandRgb = { r: 99, g: 102, b: 241 }; // #6366f1
        const borderColor = '#e2e8f0';
        const lightGray = '#f8fafc';

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        };

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

        // Report progress
        self.postMessage({ type: 'progress', value: 10 });

        // Page 1 — Header + Title
        addHeader(true);
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

        self.postMessage({ type: 'progress', value: 30 });

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

        self.postMessage({ type: 'progress', value: 50 });

        y += 10;

        // Charts (pre-captured images)
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

                self.postMessage({ type: 'progress', value: 50 + ((i + 1) / chartImages.length) * 40 });
            });
        }

        addFooter(doc.getCurrentPageInfo().pageNumber);

        self.postMessage({ type: 'progress', value: 95 });

        // Generate as array buffer
        const pdfOutput = doc.output('arraybuffer');
        self.postMessage({ type: 'complete', buffer: pdfOutput, filename: `${title.replace(/\s+/g, '_')}_Pro_Report.pdf` }, [pdfOutput] as any);

    } catch (error: any) {
        self.postMessage({ type: 'error', message: error.message });
    }
};
