// Google Apps Script
// AWS S3 Bucket, Access Key, and Secret Key
const AWS_BUCKET = "Your AWS S3 Bucket";
const AWS_ACCESS_KEY = "Your AWS S3 Access Key";
const AWS_SECRET_KEY = "Your AWS S3 Secret Key";

// Function to send data to AWS S3
const sendToS3 = (fileName, cellValues) => {
  // Initialize S3BindingLibrary for AWS S3 interaction
  const s3 = S3BindingLibrary.getInstance(AWS_ACCESS_KEY, AWS_SECRET_KEY);

  // Specify the file path in the AWS S3 bucket
  const filePath = "Your S3 File Path";

  // Upload data to AWS S3
  s3.putObject(AWS_BUCKET, filePath, cellValues);
  Logger.log("Published to AWS S3: " + filePath);
};

// Function to get the current date in a specific format
const formattedDate = () => {
  const dt = new Date();

  // Construct a date format string (YYYYMMHHmm)
  const dateFormat = `${dt.getFullYear()}${dt.getMonth() + 1}${dt.getHours()}${dt.getMinutes()}`;
  return dateFormat;
};

// Function to get active rows in a Google Sheets sheet
const activeRows = (sheet) => {
  // Retrieve all displayed values in the sheet
  const rows = sheet.getDataRange().getDisplayValues()
    // Filter out rows with no data
    .filter(row => row.some(val => typeof val !== 'string' || val.length))
    // Filter out columns without headers
    .map((row, _, rows) =>
      row.filter((_, index) => rows[0][index].length)
    );
  return rows;
};

// Function to publish JSON data to AWS S3
var publishJson = (sheet) => {
  const rows = activeRows(sheet);

  // If there's no data (only header), return undefined
  if (rows.length <= 1) {
    return undefined;
  }

  // Convert sheet data to JSON format
  const cells = rows.slice(1).map(row =>
    row.reduce((acc, val, index) => Object.assign(
      acc,
      { [rows[0][index]]: (typeof val === 'string' && !val.length) ? null : val }
    ), {})
  );

  // Generate a file name with the sheet name and formatted date
  const fileName = `${sheet.getName().replace(/ /g, '')}_${formattedDate()}.json`;
  Logger.log("Json format generated for " + sheet.getName());
  
  // Send JSON data to AWS S3
  sendToS3(fileName, cells);
};

// Function to publish CSV data to AWS S3
var publishCSV = (sheet) => {
  const csv = convertToCSV(sheet);

  // If there's no data (only header), return undefined
  if (csv !== undefined) {
    // Generate a file name with the sheet name and formatted date
    const fileName = `${sheet.getName().replace(/ /g, '')}_${formattedDate()}.csv`;
    
    // Create a CSV file in Blob format
    const blob = Utilities.newBlob(csv, MimeType.CSV, fileName);
    
    // Send CSV file to AWS S3
    sendToS3(fileName, blob);
  }
};

// Function to convert sheet data to CSV format
const convertToCSV = (sheet) => {
  try {
    const data = activeRows(sheet);

    // If there's no data (only header), return undefined
    if (data.length <= 1) {
      return undefined;
    }

    // Generate CSV format
    const csv = data.map(row =>
      row.map(e =>
        // Add double quotes to escape a comma or a new line in the string
        (e.toString().includes("\n") || e.toString().includes(","))
          ? `"${e}"`
          : e
      ).join(",")
    ).join("\n");

    Logger.log("CSV format generated for " + sheet.getName());
    return csv;
  } catch (error) {
    Logger.log('Failed with an error %s', error);
  }
};
