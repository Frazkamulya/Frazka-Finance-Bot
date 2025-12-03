// CONFIGURATION
var token = ""; // Your Telegram bot token
var url = ""; // Your Google Apps Script URL


// Function to set the Telegram webhook
function setWebhook() {
  var apiEndpoint = ``; // Your API Telegram

  try {
    // Make the HTTP request to set the webhook
    var response = UrlFetchApp.fetch(apiEndpoint);
    
    // Log the response to the Logger for debugging
    Logger.log(response.getContentText());
  } catch (error) {
    Logger.log("Error setting webhook: " + error);
  }
}