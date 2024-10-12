const express = require('express');
const multer = require('multer');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload and processing route
app.post('/upload', upload.array('htmlFiles',10000), (req, res) => {
  const files = req.files;
  const extractedData = [];

  files.forEach(file => {
    const filePath = file.path;
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // Example of extracting name and contact number
    const name = $('span#name').text().trim();  // Adjust the selector according to your file
    const contact = $('span#contact').text().trim();  // Adjust the selector according to your file

    extractedData.push({ name, contact });
  });

  // Convert extracted data to Excel
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(extractedData);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Details');

  const excelFilePath = path.join(__dirname, 'extracted_data.xlsx');
  xlsx.writeFile(workbook, excelFilePath);

  res.download(excelFilePath, 'extracted_data.xlsx', err => {
    if (err) console.error('Error downloading file:', err);
  });
});

// Start server
const PORT = 3300;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
