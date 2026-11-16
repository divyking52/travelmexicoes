import { jsPDF } from 'jspdf'
import type { Catalog, TravelDraft } from './catalog'
import { normalizeDraft, selectedExperiences, interestLabels, recommendationReason } from './catalog'
import type { Locale } from './content'
import { bookingURL } from './content'

export function exportGuidePDF(locale: Locale, draft: TravelDraft, catalog: Catalog) {
  const d = normalizeDraft(draft, catalog)
  const destination = catalog.destinations.find(x => x.id === d.destinationId)
  if (!destination) throw new Error('Destination not found')
  const es = locale === 'es'
  const experiences = selectedExperiences(catalog, d)

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 45
  const contentWidth = pageWidth - margin * 2
  let y = 50

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - 55) {
      doc.addPage()
      y = 50
      drawHeader()
    }
  }

  function drawHeader() {
    doc.setFillColor(17, 56, 51) // Forest green
    doc.rect(margin, y, contentWidth, 3, 'F')
    y += 18
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(17, 56, 51)
    doc.text('TRAVEL MÉXICO · MY MÉXICO. MY WAY.', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 115, 110)
    doc.text(es ? 'Guía Personalizada de Viaje' : 'Custom Travel Guide', pageWidth - margin, y, { align: 'right' })
    y += 18
  }

  drawHeader()

  // Destination Title & Tag
  doc.setFont('times', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(17, 56, 51)
  doc.text(destination.title, margin, y)
  y += 20

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 100, 95)
  const regionName = destination.region === 'caribe' ? (es ? 'Caribe Mexicano' : 'Mexican Caribbean') : 'Baja California'
  doc.text(`${regionName} · ${destination.sourced ? (es ? 'Fuentes verificadas' : 'Sourced catalog') : (es ? 'Sin cobertura propia' : 'No standalone coverage')}`, margin, y)
  y += 18

  // Destination Summary
  if (destination.summary) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 55, 50)
    const summaryLines = doc.splitTextToSize(destination.summary, contentWidth)
    checkPageBreak(summaryLines.length * 14)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 14 + 14
  }

  // Selected Interests
  if (d.interests.length > 0) {
    checkPageBreak(30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(17, 56, 51)
    doc.text((es ? 'Intereses seleccionados: ' : 'Selected interests: ') + d.interests.map(i => interestLabels[i]?.[locale] || i).join(', '), margin, y)
    y += 18
  }

  // Traveler Notes
  if (d.notes && d.notes.trim()) {
    checkPageBreak(40)
    doc.setFillColor(242, 246, 244)
    doc.setDrawColor(205, 220, 215)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(17, 56, 51)

    const noteLines = doc.splitTextToSize(d.notes.trim(), contentWidth - 20)
    const boxHeight = noteLines.length * 13 + 30
    doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, 'FD')
    doc.text(es ? 'Notas del viajero y ritmo preferido:' : 'Traveler notes and pace:', margin + 10, y + 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 45, 40)
    doc.text(noteLines, margin + 10, y + 32)
    y += boxHeight + 18
  }

  // Experiences Header
  checkPageBreak(40)
  doc.setFont('times', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 56, 51)
  doc.text((es ? 'Fichas y Experiencias Seleccionadas (' : 'Selected Experiences & Entries (') + experiences.length + ')', margin, y)
  y += 18

  if (experiences.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(100, 115, 110)
    doc.text(es ? 'No hay experiencias seleccionadas aún en este borrador.' : 'No experiences selected yet in this draft.', margin, y)
    y += 24
  } else {
    experiences.forEach((exp, idx) => {
      checkPageBreak(90)
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(215, 225, 220)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(17, 56, 51)
      doc.text(`${idx + 1}. ${exp.title}`, margin, y)
      y += 14

      if (exp.area) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(7, 83, 75)
        doc.text(exp.area.toUpperCase(), margin, y)
        y += 12
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(45, 60, 55)
      const descLines = doc.splitTextToSize(exp.description, contentWidth)
      checkPageBreak(descLines.length * 13)
      doc.text(descLines, margin, y)
      y += descLines.length * 13 + 6

      // Reason / Match
      const reason = recommendationReason(exp, d.interests, locale)
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      doc.setTextColor(80, 105, 100)
      doc.text(reason, margin, y)
      y += 12

      // Checks & Limits
      if (exp.checks.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(90, 105, 100)
        exp.checks.forEach(c => {
          checkPageBreak(12)
          doc.text(`• ${c}`, margin + 8, y)
          y += 11
        })
      }

      if (exp.coverageGaps) {
        checkPageBreak(14)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(140, 80, 60)
        doc.text(`${es ? 'Límites' : 'Limits'}: ${exp.coverageGaps}`, margin + 8, y)
        y += 12
      }

      y += 10
    })
  }

  // Footer Disclaimer
  checkPageBreak(65)
  y += 10
  doc.setDrawColor(200, 215, 210)
  doc.line(margin, y, pageWidth - margin, y)
  y += 16

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(17, 56, 51)
  doc.text(es ? 'AVISO Y CONDICIONES:' : 'DISCLOSURE & NOTICE:', margin, y)
  y += 11

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(100, 115, 110)
  const notice = es
    ? 'Borrador editable y personal. No generado por IA. No es una reservación con tarifas ni horarios contratados. Confirma directamente precios, accesos y disponibilidad con cada prestador o visita ' + bookingURL
    : 'Personal editable draft. Not AI-generated. Not a confirmed booking with live rates or guaranteed schedules. Check conditions, prices and access directly with providers or visit ' + bookingURL
  const noticeLines = doc.splitTextToSize(notice, contentWidth)
  doc.text(noticeLines, margin, y)

  doc.save(`my-mexico-${destination.id}-${locale}.pdf`)
}
