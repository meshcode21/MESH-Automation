const express = require('express');
const multer = require('multer');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

let extractedData = [];
let totalFiles = 0;
let processedFiles = 0;

app.use(express.static('public'));

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File upload and processing route with progress tracking
app.post('/upload', upload.array('htmlFiles', 10000), (req, res) => {
  const files = req.files;
  extractedData = [];
  processedFiles = 0;
  totalFiles = files.length;

  files.forEach((file) => {
    const filePath = file.path;
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // Example of extracting name and contact number
    const name = $('span#name').text().trim();
    const contact = $('span#contact').text().trim();

    extractedData.push({ name, contact });

      processedFiles++;

    if (processedFiles === totalFiles) {
      // Convert extracted data to Excel when all files are processed
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.json_to_sheet(extractedData);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Details');

      const excelFilePath = path.join(__dirname, 'extracted_data.xlsx');
      xlsx.writeFile(workbook, excelFilePath);
    }
  });

  res.status(200).send('Files uploaded and processing started');
});

// Progress tracking route using Server-Sent Events (SSE)
app.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(() => {
    const progress = Math.round((processedFiles / totalFiles) * 100);

    res.write(`data: ${JSON.stringify({ progress })}\n\n`);

    // If processing is complete, stop sending updates
    if (progress === 100) {
      clearInterval(interval);
    }
  }, 5);  // Adjust interval to send progress every 500ms
});

// Route to download the Excel file after processing
app.get('/download', (req, res) => {
  const excelFilePath = path.join(__dirname, 'extracted_data.xlsx');
  res.download(excelFilePath, 'extracted_data.xlsx', (err) => {
    if (err) console.error('Error downloading file:', err);
  });

  // const dir = 'uploads';
  const directory = 'uploads';

  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error('Error reading the directory:', err);
      return;
    }

    // Loop through each file and delete it
    files.forEach((file) => {
      const filePath = path.join(directory, file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${file}:`, err);
        } 
        // else {
        //   console.log(`Deleted file: ${file}`);
        // }
      });
    });
  });

});

// Start server
const PORT = 3300;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
