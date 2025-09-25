// PDF generation utilities using jsPDF
import { Transaction, Goal, Budget, ExportData, formatCurrency, formatDate, calculateSummary } from './exportUtils';

// Define jsPDF interface to avoid TypeScript errors
interface jsPDFInstance {
  text: (text: string, x: number, y: number, options?: any) => void;
  setFontSize: (size: number) => void;
  setFont: (fontName: string, fontStyle?: string) => void;
  addPage: () => void;
  save: (filename: string) => void;
  internal: {
    pageSize: {
      width: number;
      height: number;
    };
  };
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  rect: (x: number, y: number, width: number, height: number, style?: string) => void;
  setDrawColor: (r: number, g?: number, b?: number) => void;
  setFillColor: (r: number, g?: number, b?: number) => void;
  setTextColor: (r: number, g?: number, b?: number) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
}

// This would normally be imported from jspdf, but we'll create a mock interface for now
const createPDF = (): jsPDFInstance => {
  // In a real implementation, this would be: new jsPDF()
  // For now, we'll create a mock that demonstrates the structure
  return {
    text: (text: string, x: number, y: number) => console.log(`PDF Text: ${text} at (${x}, ${y})`),
    setFontSize: (size: number) => console.log(`PDF Font Size: ${size}`),
    setFont: (fontName: string, fontStyle?: string) => console.log(`PDF Font: ${fontName} ${fontStyle || ''}`),
    addPage: () => console.log('PDF: Add Page'),
    save: (filename: string) => {
      console.log(`PDF would be saved as: ${filename}`);
      // In a real implementation, this would actually download the PDF
      // For demo purposes, we'll create a simple text file
      const blob = new Blob([`PDF Report: ${filename}\nGenerated at: ${new Date().toISOString()}`], {
        type: 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.pdf', '.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    internal: {
      pageSize: { width: 210, height: 297 } // A4 size in mm
    },
    line: (x1: number, y1: number, x2: number, y2: number) => console.log(`PDF Line: (${x1},${y1}) to (${x2},${y2})`),
    rect: (x: number, y: number, width: number, height: number, style?: string) =>
      console.log(`PDF Rect: (${x},${y}) ${width}x${height} ${style || ''}`),
    setDrawColor: (r: number, g?: number, b?: number) => console.log(`PDF Draw Color: RGB(${r},${g || r},${b || r})`),
    setFillColor: (r: number, g?: number, b?: number) => console.log(`PDF Fill Color: RGB(${r},${g || r},${b || r})`),
    setTextColor: (r: number, g?: number, b?: number) => console.log(`PDF Text Color: RGB(${r},${g || r},${b || r})`),
    splitTextToSize: (text: string, maxWidth: number) => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        if ((currentLine + word).length * 2 > maxWidth) { // Rough character width estimate
          if (currentLine) lines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });

      if (currentLine) lines.push(currentLine.trim());
      return lines;
    }
  };
};

export const generateTransactionReport = (
  transactions: Transaction[],
  dateRange: { startDate: Date; endDate: Date },
  options: { includeCharts?: boolean; includeCategories?: boolean } = {}
): void => {
  const doc = createPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Report', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`, margin, yPosition);
  yPosition += 5;
  doc.text(`Generated: ${formatDate(new Date())}`, margin, yPosition);
  yPosition += 15;

  // Summary
  const summary = calculateSummary(transactions, dateRange);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Income: ${formatCurrency(summary.totalIncome)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Expenses: ${formatCurrency(summary.totalExpenses)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Net Amount: ${formatCurrency(summary.netAmount)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Transaction Count: ${summary.transactionCount}`, margin, yPosition);
  yPosition += 15;

  // Transactions Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Transactions', margin, yPosition);
  yPosition += 10;

  // Table headers
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const colWidths = [25, 50, 25, 25, 30];
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
  let xPosition = margin;

  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += colWidths[index];
  });
  yPosition += 5;

  // Draw line under headers
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Transaction rows
  doc.setFont('helvetica', 'normal');
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
  });

  filteredTransactions.slice(0, 30).forEach(transaction => { // Limit to first 30 for demo
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    xPosition = margin;
    const rowData = [
      transaction.date.toLocaleDateString(),
      transaction.description.substring(0, 20) + (transaction.description.length > 20 ? '...' : ''),
      formatCurrency(transaction.amount),
      transaction.type,
      transaction.category
    ];

    rowData.forEach((data, index) => {
      doc.text(data, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 5;
  });

  if (filteredTransactions.length > 30) {
    yPosition += 10;
    doc.text(`... and ${filteredTransactions.length - 30} more transactions`, margin, yPosition);
  }

  const filename = `transaction_report_${dateRange.startDate.toISOString().split('T')[0]}_to_${dateRange.endDate.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const generateGoalProgressReport = (goals: Goal[]): void => {
  const doc = createPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Goal Progress Report', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date())}`, margin, yPosition);
  yPosition += 15;

  // Summary Statistics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Overview', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Goals: ${totalGoals}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Completed Goals: ${completedGoals}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Active Goals: ${activeGoals}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Overall Progress: ${overallProgress.toFixed(1)}%`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Target Amount: ${formatCurrency(totalTargetAmount)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Current Amount: ${formatCurrency(totalCurrentAmount)}`, margin, yPosition);
  yPosition += 15;

  // Individual Goals
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Goal Details', margin, yPosition);
  yPosition += 10;

  goals.forEach(goal => {
    if (yPosition > 250) { // Check if we need a new page
      doc.addPage();
      yPosition = margin;
    }

    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(goal.title, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Category: ${goal.category}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Target: ${formatCurrency(goal.targetAmount)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Current: ${formatCurrency(goal.currentAmount)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Progress: ${progress.toFixed(1)}%`, margin, yPosition);
    yPosition += 5;
    doc.text(`Status: ${goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Target Date: ${formatDate(goal.targetDate)}`, margin, yPosition);
    yPosition += 10;

    // Draw a simple progress bar
    const barWidth = 100;
    const barHeight = 6;
    const progressWidth = (progress / 100) * barWidth;

    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPosition, barWidth, barHeight, 'F');

    // Progress bar
    doc.setFillColor(59, 130, 246); // Blue color
    doc.rect(margin, yPosition, progressWidth, barHeight, 'F');

    yPosition += 15;
  });

  const filename = `goal_progress_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const generateBudgetReport = (budgets: Budget[]): void => {
  const doc = createPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Analysis Report', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${formatDate(new Date())}`, margin, yPosition);
  yPosition += 15;

  // Summary
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpentAmount = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const overBudgetCount = budgets.filter(b => b.spentAmount > b.budgetAmount).length;
  const utilizationRate = totalBudgetAmount > 0 ? (totalSpentAmount / totalBudgetAmount) * 100 : 0;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Summary', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Budget Amount: ${formatCurrency(totalBudgetAmount)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total Spent: ${formatCurrency(totalSpentAmount)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Overall Utilization: ${utilizationRate.toFixed(1)}%`, margin, yPosition);
  yPosition += 6;
  doc.text(`Budgets Over Limit: ${overBudgetCount}`, margin, yPosition);
  yPosition += 15;

  // Individual Budgets
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Budget Details', margin, yPosition);
  yPosition += 10;

  budgets.forEach(budget => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = margin;
    }

    const utilization = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0;
    const remaining = budget.budgetAmount - budget.spentAmount;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(budget.name, margin, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Category: ${budget.category}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Budget: ${formatCurrency(budget.budgetAmount)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Spent: ${formatCurrency(budget.spentAmount)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Remaining: ${formatCurrency(remaining)}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Utilization: ${utilization.toFixed(1)}%`, margin, yPosition);
    yPosition += 5;
    doc.text(`Period: ${budget.period}`, margin, yPosition);
    yPosition += 10;

    // Progress bar for budget utilization
    const barWidth = 100;
    const barHeight = 6;
    const utilizationWidth = Math.min((utilization / 100) * barWidth, barWidth);

    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, yPosition, barWidth, barHeight, 'F');

    // Utilization bar (color based on percentage)
    if (utilization <= 70) {
      doc.setFillColor(34, 197, 94); // Green
    } else if (utilization <= 90) {
      doc.setFillColor(251, 191, 36); // Yellow
    } else {
      doc.setFillColor(239, 68, 68); // Red
    }
    doc.rect(margin, yPosition, utilizationWidth, barHeight, 'F');

    yPosition += 15;
  });

  const filename = `budget_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const generateComprehensiveReport = (data: ExportData): void => {
  const doc = createPDF();
  let yPosition = 20;

  // Main Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Comprehensive Financial Report', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${data.summary.dateRange}`, 20, yPosition);
  yPosition += 5;
  doc.text(`Generated: ${formatDate(data.summary.generatedAt)}`, 20, yPosition);
  yPosition += 20;

  // Executive Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Income: ${formatCurrency(data.summary.totalIncome)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Expenses: ${formatCurrency(data.summary.totalExpenses)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Net Amount: ${formatCurrency(data.summary.netAmount)}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Total Transactions: ${data.summary.transactionCount}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Active Goals: ${data.goals.filter(g => g.status === 'active').length}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Active Budgets: ${data.budgets.length}`, 20, yPosition);

  // Add sections for transactions, goals, and budgets
  // (This would include more detailed breakdowns)

  const filename = `comprehensive_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};