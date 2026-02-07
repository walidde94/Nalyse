import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (data: any, title: string) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let y = margin;

        // Brand Colors
        const primaryColor = '#6366f1'; // Indigo/Primary
        const secondaryColor = '#8b5cf6'; // Violet offset
        const textColor = '#1e293b'; // Slate 800
        const lightGray = '#f8fafc'; // Slate 50
        const borderColor = '#e2e8f0'; // Slate 200

        // Helper: HEX to RGB for jsPDF
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 0, g: 0, b: 0 };
        }

        const brandRgb = hexToRgb(primaryColor);

        // --- Header Function ---
        const addHeader = (isFirstPage = false) => {
            // Top Accent Bar
            doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
            doc.rect(0, 0, pageWidth, 5, 'F');

            // Header Content
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 5, pageWidth, 25, 'F');

            // Logo / Brand Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(20);
            doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
            doc.text("Nalyse", margin, 22);

            // Date & Metadata
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(100);
            const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            doc.text(dateStr, pageWidth - margin, 18, { align: "right" });
            doc.text("Automated Intelligence Report", pageWidth - margin, 23, { align: "right" });

            // Separator Line
            doc.setDrawColor(borderColor);
            doc.setLineWidth(0.5);
            doc.line(margin, 32, pageWidth - margin, 32);

            y = 45; // Set Y content start
        };

        // --- Footer Function ---
        const addFooter = (pageNo: number) => {
            const footerY = pageHeight - 15;
            doc.setDrawColor(borderColor);
            doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${pageNo}`, pageWidth / 2, footerY + 2, { align: "center" });
            doc.text("Nalyse confidential • Generated automatically", pageWidth - margin, footerY + 2, { align: "right" });
        };

        // Start Page 1
        addHeader(true);

        // Report Title
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

        // --- Executive Summary Cards ---
        const summaryData = [
            { label: "Total Rows", value: data.summary.rows?.toLocaleString() || '0' },
            { label: "Columns", value: data.summary.columns?.toString() || '0' },
            { label: "Data Score", value: (data.dataHealth?.score || 0) + '%' }
        ];

        let xOffset = margin;
        const cardGap = 10;
        const boxWidth = (pageWidth - (margin * 2) - (cardGap * 2)) / 3;
        const boxHeight = 30;

        summaryData.forEach((item) => {
            // Card background
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(220);
            doc.setLineWidth(0.2);
            doc.roundedRect(xOffset, y, boxWidth, boxHeight, 3, 3, 'FD');

            // Left Border Accent
            doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
            doc.rect(xOffset, y, 2, boxHeight, 'F'); // solid accent bar

            // Label
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(item.label.toUpperCase(), xOffset + 10, y + 10);

            // Value
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(30);
            doc.text(item.value, xOffset + 10, y + 22);

            xOffset += boxWidth + cardGap;
        });

        y += 45;

        // --- Strategic Findings Section ---
        if (data.keyFindings && data.keyFindings.length > 0) {
            // Section Header
            doc.setFillColor(lightGray);
            doc.roundedRect(margin, y, pageWidth - (margin * 2), 10, 2, 2, 'F');
            doc.setFontSize(11);
            doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
            doc.setFont("helvetica", "bold");
            doc.text("STRATEGIC FINDINGS", margin + 5, y + 7);
            y += 20;

            // List Items
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(50);

            data.keyFindings.slice(0, 5).forEach((finding: any) => {
                const text = finding.description.replace(/\*\*/g, '').replace(/^💡\s*/, '');
                const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - 15);

                // Page Break Check
                if (y + (splitText.length * 5) > pageHeight - 30) {
                    addFooter(doc.getCurrentPageInfo().pageNumber);
                    doc.addPage();
                    addHeader();
                }

                // Bullet Point
                doc.setFillColor(234, 179, 8); // Warning/Yellow
                doc.circle(margin + 2, y - 1, 1.5, 'F');

                doc.text(splitText, margin + 10, y);
                y += (splitText.length * 5) + 8;
            });
        }

        y += 10;

        // --- Visualizations Section ---
        if (data.options && data.options.length > 0) {
            // Section Header
            if (y > pageHeight - 80) { // Ensure header isn't lonely at bottom
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

            for (let i = 0; i < data.options.length; i++) {
                const chartId = `chart-${i}`;
                const chartElement = document.getElementById(chartId);

                if (chartElement) {
                    // Capture chart
                    const canvas = await html2canvas(chartElement, {
                        scale: 2,
                        backgroundColor: '#161b22'
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const imgH = 90;
                    const imgW = pageWidth - (margin * 2);

                    // Page Break Check
                    if (y + imgH + 20 > pageHeight - 30) {
                        addFooter(doc.getCurrentPageInfo().pageNumber);
                        doc.addPage();
                        addHeader();
                    }

                    // Chart Title
                    doc.setFontSize(12);
                    doc.setTextColor(0);
                    doc.text(data.options[i].title || `Chart ${i + 1}`, margin, y - 2);

                    doc.addImage(imgData, 'PNG', margin, y, imgW, imgH);

                    y += imgH + 20; // Spacing after chart
                }
            }
        }

        // Final Footer call
        addFooter(doc.getCurrentPageInfo().pageNumber);

        doc.save(`${title.replace(/\s+/g, '_')}_Pro_Report.pdf`);

    } catch (e) {
        console.error('Pro PDF Export Failed', e);
        alert('Failed to generate Professional PDF. Please try again.');
    }
};
