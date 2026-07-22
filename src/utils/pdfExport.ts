import jsPDF from 'jspdf';

interface SkillGap {
  skill: string;
  importance: string;
  learning_resource: string;
}

interface LearningPriority {
  priority: number;
  topic: string;
  reason: string;
  timeline: string;
}

interface RecommendedRole {
  title: string;
  reason: string;
  market_demand: string;
}

export const exportRoadmapToPDF = (
  recommendations: {
    recommended_roles: RecommendedRole[];
    skill_gaps: SkillGap[];
    learning_priorities: LearningPriority[];
    preparation_roadmap: string;
    market_insights: string;
  },
  userName: string = "User"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    const lines = doc.splitTextToSize(text, maxWidth);

    // Check if we need a new page
    if (yPosition + (lines.length * fontSize * 0.4) > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }

    doc.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.4 + 5;
  };

  // Add a section header
  const addSectionHeader = (title: string) => {
    yPosition += 5;
    doc.setFillColor(79, 70, 229); // Primary color
    doc.rect(margin, yPosition - 5, maxWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 5, yPosition + 2);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;
  };

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Career Preparation Roadmap', margin, 25);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Prepared for: ${userName}`, margin, 33);
  doc.setTextColor(0, 0, 0);
  yPosition = 50;

  // Date
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  addText(`Generated on: ${date}`, 10, true);
  yPosition += 5;

  // Recommended Roles
  if (recommendations.recommended_roles && recommendations.recommended_roles.length > 0) {
    addSectionHeader('Recommended Career Roles');
    recommendations.recommended_roles.forEach((role, idx) => {
      addText(`${idx + 1}. ${role.title}`, 12, true);
      addText(`Market Demand: ${role.market_demand}`, 10);
      addText(`Why this fits: ${role.reason}`, 10);
      yPosition += 3;
    });
  }

  // Skill Gaps
  if (recommendations.skill_gaps && recommendations.skill_gaps.length > 0) {
    addSectionHeader('Skills to Develop');
    recommendations.skill_gaps.forEach((gap, idx) => {
      addText(`${idx + 1}. ${gap.skill}`, 12, true);
      addText(`Importance: ${gap.importance}`, 10);
      addText(`Resource: ${gap.learning_resource}`, 10);
      yPosition += 3;
    });
  }

  // Learning Priorities
  if (recommendations.learning_priorities && recommendations.learning_priorities.length > 0) {
    addSectionHeader('Learning Priorities');
    recommendations.learning_priorities
      .sort((a, b) => a.priority - b.priority)
      .forEach((priority) => {
        addText(`Priority ${priority.priority}: ${priority.topic}`, 12, true);
        addText(`Timeline: ${priority.timeline}`, 10);
        addText(`Why focus on this: ${priority.reason}`, 10);
        yPosition += 3;
      });
  }

  // Preparation Roadmap
  if (recommendations.preparation_roadmap) {
    addSectionHeader('3-Month Preparation Plan');

    // Parse roadmap into weeks
    const roadmapLines = recommendations.preparation_roadmap.split('\n');
    let currentWeek = '';

    roadmapLines.forEach(line => {
      if (line.trim()) {
        if (line.toLowerCase().includes('week')) {
          currentWeek = line;
          addText(currentWeek, 11, true);
        } else {
          addText(`  ${line}`, 10);
        }
      }
    });
  }

  // Weekly Checklist Template
  doc.addPage();
  yPosition = margin;
  addSectionHeader('Weekly Progress Tracker');

  addText('Use this template to track your weekly progress:', 10, true);
  yPosition += 5;

  for (let week = 1; week <= 12; week++) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Week header
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, maxWidth, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Week ${week}`, margin + 5, yPosition + 10);
    yPosition += 20;

    // Checkboxes
    const tasks = ['Complete learning resources', 'Practice exercises', 'Review progress', 'Update portfolio'];
    tasks.forEach(task => {
      doc.rect(margin + 5, yPosition - 3, 3, 3); // Checkbox
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(task, margin + 12, yPosition);
      yPosition += 6;
    });

    yPosition += 5;
  }

  // Market Insights
  if (recommendations.market_insights) {
    doc.addPage();
    yPosition = margin;
    addSectionHeader('Market Insights & Positioning');
    addText(recommendations.market_insights, 10);
  }

  // Footer on last page
  doc.setFontSize(12);
  doc.setTextColor(128, 128, 128);
  doc.text('Voke - Career Preparation System', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `Career_Roadmap_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
