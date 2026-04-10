const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

class CertificateGenerator {
  
  // Generate certificate PDF
  static async generateCertificatePDF(certificate) {
    try {
      const PDFDocument = require('pdfkit');
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Create output directory if it doesn't exist
      const outputDir = path.join(__dirname, '../../certificates');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filename = `certificate_${certificate.certificateId}.pdf`;
      const filepath = path.join(outputDir, filename);
      
      // Pipe to file
      doc.pipe(fs.createWriteStream(filepath));

      // Get certificate details
      await certificate.populate('user skill');
      const userName = `${certificate.user.firstName} ${certificate.user.lastName}`;
      const skillName = certificate.skill.title;
      const issuedDate = new Date(certificate.issuedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Draw border
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
        .lineWidth(3)
        .strokeColor('#2563eb')
        .stroke();

      doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
        .lineWidth(1)
        .strokeColor('#2563eb')
        .stroke();

      // Header - Certificate Title
      doc.fontSize(40)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text('CERTIFICATE', 0, 80, { align: 'center' });

      doc.fontSize(20)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('OF SKILL VERIFICATION', 0, 130, { align: 'center' });

      // Decorative line
      doc.moveTo(pageWidth / 4, 170)
        .lineTo(pageWidth * 3 / 4, 170)
        .strokeColor('#f59e0b')
        .lineWidth(2)
        .stroke();

      // Badge
      const badgeY = 200;
      this.drawBadge(doc, pageWidth / 2, badgeY, certificate.badge);

      // Main text - This certifies that
      doc.fontSize(16)
        .fillColor('#475569')
        .font('Helvetica')
        .text('This is to certify that', 0, 280, { align: 'center' });

      // User name
      doc.fontSize(32)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text(userName, 0, 310, { align: 'center' });

      // Has demonstrated proficiency in
      doc.fontSize(16)
        .fillColor('#475569')
        .font('Helvetica')
        .text('has successfully demonstrated proficiency in', 0, 355, { align: 'center' });

      // Skill name
      doc.fontSize(24)
        .fillColor('#2563eb')
        .font('Helvetica-Bold')
        .text(skillName, 0, 385, { align: 'center' });

      // Verification method
      const methodText = this.getVerificationMethodText(certificate.verificationMethod);
      doc.fontSize(14)
        .fillColor('#64748b')
        .font('Helvetica')
        .text(methodText, 0, 425, { align: 'center' });

      // Score or rating
      if (certificate.score) {
        doc.fontSize(14)
          .fillColor('#16a34a')
          .font('Helvetica-Bold')
          .text(`Quiz Score: ${certificate.score}%`, 0, 450, { align: 'center' });
      } else if (certificate.rating) {
        doc.fontSize(14)
          .fillColor('#16a34a')
          .font('Helvetica-Bold')
          .text(`Rating: ${certificate.rating.toFixed(1)}/5.0`, 0, 450, { align: 'center' });
      }

      // Date and certificate ID
      const bottomY = pageHeight - 120;
      
      // Date
      doc.fontSize(12)
        .fillColor('#475569')
        .font('Helvetica')
        .text(`Issued on: ${issuedDate}`, 80, bottomY);

      // Certificate ID
      doc.fontSize(10)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(`Certificate ID: ${certificate.certificateId}`, 80, bottomY + 20);

      // Verification URL
      const verifyUrl = `https://skillbarter.com/verify/${certificate.certificateId}`;
      doc.fontSize(10)
        .fillColor('#3b82f6')
        .font('Helvetica')
        .text(verifyUrl, 80, bottomY + 35);

      // Signature area
      const signatureX = pageWidth - 250;
      doc.fontSize(12)
        .fillColor('#1e293b')
        .font('Helvetica-Bold')
        .text('SkillBarter Platform', signatureX, bottomY);

      doc.moveTo(signatureX, bottomY - 5)
        .lineTo(signatureX + 150, bottomY - 5)
        .strokeColor('#1e293b')
        .lineWidth(1)
        .stroke();

      doc.fontSize(10)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Authorized Signature', signatureX, bottomY + 15);

      // Finalize PDF
      doc.end();

      return new Promise((resolve, reject) => {
        doc.on('finish', () => {
          resolve(filepath);
        });
        doc.on('error', reject);
      });
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
      throw error;
    }
  }

  // Draw badge
  static drawBadge(doc, x, y, badgeType) {
    const badgeColors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2'
    };

    const color = badgeColors[badgeType] || badgeColors.bronze;

    // Outer circle
    doc.circle(x, y, 35)
      .fillColor(color)
      .fill();

    // Inner circle
    doc.circle(x, y, 30)
      .fillColor('#ffffff')
      .fill();

    // Badge text
    doc.fontSize(10)
      .fillColor(color)
      .font('Helvetica-Bold')
      .text(badgeType.toUpperCase(), x - 30, y - 5, {
        width: 60,
        align: 'center'
      });
  }

  // Get verification method text
  static getVerificationMethodText(method) {
    const texts = {
      quiz: 'Through successful completion of skill assessment quiz',
      portfolio: 'Through portfolio review and evaluation',
      peer_review: 'Through peer review and community validation',
      expert_review: 'Through expert review and validation',
      endorsement: 'Through community endorsements'
    };

    return texts[method] || 'Through skill verification';
  }

  // Generate and save certificate
  static async generateAndSave(certificate) {
    try {
      const filepath = await this.generateCertificatePDF(certificate);
      
      // Update certificate with PDF path
      certificate.pdfPath = filepath;
      await certificate.save();

      return filepath;
    } catch (error) {
      console.error('Error generating and saving certificate:', error);
      throw error;
    }
  }
}

module.exports = CertificateGenerator;