$docxPath = "d:\DBMS\dbms team project\docs\final-report\CampusFix_Final_DBMS_Report.docx"
$pdfPath = "d:\DBMS\dbms team project\docs\final-report\CampusFix_Final_DBMS_Report.pdf"

Write-Host "Starting Word COM Application..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false

try {
    Write-Host "Opening DOCX: $docxPath"
    $doc = $word.Documents.Open($docxPath)
    Write-Host "Converting and saving to PDF: $pdfPath"
    $wdFormatPDF = 17
    $doc.SaveAs([ref]$pdfPath, [ref]$wdFormatPDF)
    $doc.Close([ref]$false)
    Write-Host "SUCCESS: PDF generated successfully!"
}
catch {
    Write-Error "Failed to convert DOCX to PDF: $_"
}
finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
