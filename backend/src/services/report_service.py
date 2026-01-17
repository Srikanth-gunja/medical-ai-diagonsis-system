"""Report generation service using LangChain and ReportLab."""
import os
import io
from datetime import datetime
from flask import current_app
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage


def get_llm():
    """Create and configure the Gemini chat model."""
    api_key = current_app.config.get('GOOGLE_API_KEY') or os.environ.get('GOOGLE_API_KEY')
    
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not configured.")
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.3,
        convert_system_message_to_human=True
    )


def generate_ai_summary(prescription_data: dict, patient_name: str, doctor_name: str) -> str:
    """Use LangChain to generate an AI-enhanced summary of the prescription."""
    try:
        llm = get_llm()
        
        medications_text = "\n".join([
            f"- {med['name']}: {med['dosage']}, {med.get('frequency', 'as directed')}, for {med.get('duration', 'as prescribed')}"
            for med in prescription_data.get('medications', [])
        ])
        
        system_prompt = """You are a medical report assistant. Generate a brief, professional summary paragraph 
for a patient's medical report based on the prescription details provided. 
The summary should be clear, reassuring, and easy to understand for the patient.
Keep it concise (2-3 sentences max). Do not include any medical advice beyond what's in the prescription."""

        user_prompt = f"""
Patient: {patient_name}
Doctor: {doctor_name}
Diagnosis: {prescription_data.get('diagnosis', 'General consultation')}
Medications prescribed:
{medications_text}
Doctor's notes: {prescription_data.get('notes', 'No additional notes')}

Generate a brief professional summary for this prescription report.
"""
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        return response.content
        
    except Exception as e:
        # Fallback to a simple summary if AI fails
        return f"This prescription was issued for {prescription_data.get('diagnosis', 'your medical condition')}. Please follow the medication instructions as directed by your doctor."


def generate_prescription_pdf(
    prescription: dict,
    patient_name: str,
    patient_email: str,
    doctor_name: str,
    doctor_specialty: str,
    appointment_date: str
) -> io.BytesIO:
    """Generate a PDF report for a prescription."""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor('#1e40af')
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.gray,
        spaceAfter=20
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e3a5f'),
        spaceBefore=15,
        spaceAfter=10,
        borderPadding=5
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14
    )
    
    small_style = ParagraphStyle(
        'SmallText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.gray,
        alignment=TA_CENTER
    )
    
    story = []
    
    # Header
    story.append(Paragraph("MediCare AI", title_style))
    story.append(Paragraph("Medical Prescription Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1e40af'), spaceAfter=20))
    
    # Patient Information
    story.append(Paragraph("Patient Information", section_header_style))
    
    patient_data = [
        ['Patient Name:', patient_name, 'Report Date:', datetime.now().strftime('%B %d, %Y')],
        ['Email:', patient_email, 'Consultation Date:', appointment_date or 'N/A'],
    ]
    
    patient_table = Table(patient_data, colWidths=[1.3*inch, 2.2*inch, 1.3*inch, 2.2*inch])
    patient_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 15))
    
    # Doctor Information
    story.append(Paragraph("Attending Physician", section_header_style))
    
    doctor_data = [
        ['Doctor:', f"Dr. {doctor_name}"],
        ['Specialty:', doctor_specialty],
    ]
    
    doctor_table = Table(doctor_data, colWidths=[1.3*inch, 5.7*inch])
    doctor_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(doctor_table)
    story.append(Spacer(1, 15))
    
    # Diagnosis
    story.append(Paragraph("Diagnosis", section_header_style))
    diagnosis = prescription.get('diagnosis', 'General consultation')
    story.append(Paragraph(diagnosis, body_style))
    story.append(Spacer(1, 10))
    
    # AI Summary
    story.append(Paragraph("Summary", section_header_style))
    ai_summary = generate_ai_summary(prescription, patient_name, doctor_name)
    story.append(Paragraph(ai_summary, body_style))
    story.append(Spacer(1, 10))
    
    # Medications
    story.append(Paragraph("Prescribed Medications", section_header_style))
    
    medications = prescription.get('medications', [])
    if medications:
        med_data = [['Medication', 'Dosage', 'Frequency', 'Duration', 'Instructions']]
        
        for med in medications:
            med_data.append([
                med.get('name', '-'),
                med.get('dosage', '-'),
                med.get('frequency', 'As directed'),
                med.get('duration', 'As prescribed'),
                med.get('instructions', '-')[:50] + ('...' if len(med.get('instructions', '')) > 50 else '')
            ])
        
        med_table = Table(med_data, colWidths=[1.4*inch, 1*inch, 1.2*inch, 1*inch, 2.2*inch])
        med_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            # Body
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            # Alternating row colors
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ]))
        story.append(med_table)
    else:
        story.append(Paragraph("No medications prescribed.", body_style))
    
    story.append(Spacer(1, 15))
    
    # Doctor's Notes
    notes = prescription.get('notes', '')
    if notes:
        story.append(Paragraph("Doctor's Notes", section_header_style))
        story.append(Paragraph(notes, body_style))
        story.append(Spacer(1, 15))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceBefore=10, spaceAfter=10))
    
    disclaimer = """
    <b>Disclaimer:</b> This report is generated based on your consultation and prescription details. 
    It is for informational purposes only. Always follow your doctor's instructions and consult 
    them if you have any questions or concerns about your treatment. This report was generated 
    with AI-assisted technology.
    """
    story.append(Paragraph(disclaimer, small_style))
    
    generated_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | MediCare AI Platform"
    story.append(Spacer(1, 10))
    story.append(Paragraph(generated_text, small_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer


def generate_medical_record_pdf(
    record: dict,
    patient_name: str,
    patient_email: str,
    doctor_name: str
) -> io.BytesIO:
    """Generate a PDF report for a medical record."""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=22,
        alignment=TA_CENTER,
        spaceAfter=6,
        textColor=colors.HexColor('#1e40af')
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        textColor=colors.gray,
        spaceAfter=20
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e3a5f'),
        spaceBefore=15,
        spaceAfter=10,
        borderPadding=5
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14
    )
    
    small_style = ParagraphStyle(
        'SmallText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.gray,
        alignment=TA_CENTER
    )
    
    story = []
    
    # Header
    story.append(Paragraph("MediCare AI", title_style))
    story.append(Paragraph("Medical Record Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1e40af'), spaceAfter=20))
    
    # Patient Information
    story.append(Paragraph("Patient Information", section_header_style))
    
    record_date = record.get('date', 'N/A')
    if isinstance(record_date, datetime):
        record_date = record_date.strftime('%B %d, %Y')
    
    patient_data = [
        ['Patient Name:', patient_name, 'Report Date:', datetime.now().strftime('%B %d, %Y')],
        ['Email:', patient_email, 'Record Date:', record_date],
    ]
    
    patient_table = Table(patient_data, colWidths=[1.3*inch, 2.2*inch, 1.3*inch, 2.2*inch])
    patient_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#374151')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 15))
    
    # Attending Doctor
    story.append(Paragraph("Attending Physician", section_header_style))
    story.append(Paragraph(f"Dr. {doctor_name}", body_style))
    story.append(Spacer(1, 15))
    
    # Record Type
    record_type = record.get('type', 'General')
    story.append(Paragraph("Record Type", section_header_style))
    story.append(Paragraph(record_type, body_style))
    story.append(Spacer(1, 10))
    
    # Description
    description = record.get('description', 'No description available')
    story.append(Paragraph("Description", section_header_style))
    story.append(Paragraph(description, body_style))
    story.append(Spacer(1, 10))
    
    # Result (if available)
    result = record.get('result', '')
    if result:
        story.append(Paragraph("Result", section_header_style))
        story.append(Paragraph(result, body_style))
        story.append(Spacer(1, 10))
    
    # Notes (if available)
    notes = record.get('notes', '')
    if notes:
        story.append(Paragraph("Notes", section_header_style))
        story.append(Paragraph(notes, body_style))
        story.append(Spacer(1, 15))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceBefore=10, spaceAfter=10))
    
    disclaimer = """
    <b>Disclaimer:</b> This report is generated based on your medical records. 
    It is for informational purposes only. Please consult your doctor if you have 
    any questions about your medical history.
    """
    story.append(Paragraph(disclaimer, small_style))
    
    generated_text = f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | MediCare AI Platform"
    story.append(Spacer(1, 10))
    story.append(Paragraph(generated_text, small_style))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return buffer
