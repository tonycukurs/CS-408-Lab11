import { sayHello, addItem, loadData, deleteItem } from '../js/main.js';

QUnit.module('hello', function() {
    QUnit.test('make sure the hello function says hello', function(assert) {
        var result = sayHello();
        assert.equal(result, 'hello');
    });
});

// Tests for the inventory application

// We need to mock XMLHttpRequest for testing API interactions
let xhr;
let requests = [];

// Setup mock before each test
QUnit.testStart(function() {
  // Mock XMLHttpRequest
  xhr = sinon.useFakeXMLHttpRequest();
  requests = [];
  xhr.onCreate = function(request) {
    requests.push(request);
  };
  
  // Reset the DOM elements we'll be testing
  document.body.innerHTML = `
    <h1>Simple Inventory App</h1>
    <button id="load-data">Load Data</button>
    <main class="grid">
      <div class="item-form">
        <h2>Add New Item</h2>
        <div class="form-group">
          <label for="item-id">ID:</label>
          <input type="text" id="item-id" placeholder="Enter item ID">
        </div>
        <div class="form-group">
          <label for="item-name">Name:</label>
          <input type="text" id="item-name" placeholder="Enter item name">
        </div>
        <div class="form-group">
          <label for="item-price">Price:</label>
          <input type="number" id="item-price" placeholder="Enter item price">
        </div>
        <button id="send-data">Add Item</button>
      </div>
      <p id="form-status"></p>
      <p id="lambda-info"></p>
      <table id="inventory-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Price</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="inventory-body">
        </tbody>
      </table>
    </main>`;

  // Setup event listeners
  document.getElementById("send-data").addEventListener('click', addItem);
  document.getElementById("load-data").addEventListener('click', loadData);
});

// Cleanup after each test
QUnit.testDone(function() {
  xhr.restore();
});

// Form validation tests
QUnit.module('Form Validation', function() {
  QUnit.test('Empty fields validation', function(assert) {
    document.getElementById("item-id").value = "";
    document.getElementById("item-name").value = "";
    document.getElementById("item-price").value = "";
    
    addItem();
    
    assert.equal(
      document.getElementById("form-status").innerHTML,
      "Please fill in all fields",
      "Should show validation message when all fields are empty"
    );
    assert.equal(requests.length, 0, "No request should be sent");
  });
  
  QUnit.test('Partial fields validation', function(assert) {
    document.getElementById("item-id").value = "123";
    document.getElementById("item-name").value = "";
    document.getElementById("item-price").value = "10";
    
    addItem();
    
    assert.equal(
      document.getElementById("form-status").innerHTML,
      "Please fill in all fields",
      "Should show validation message when some fields are empty"
    );
    assert.equal(requests.length, 0, "No request should be sent");
  });
});

// Item Addition tests
QUnit.module('Add Item', function() {
  QUnit.test('Add item success', function(assert) {
    document.getElementById("item-id").value = "123";
    document.getElementById("item-name").value = "Test Item";
    document.getElementById("item-price").value = "19.99";
    
    addItem();
    
    assert.equal(requests.length, 1, "Should make one PUT request");
    assert.equal(requests[0].method, "PUT", "Should use PUT method");
    assert.equal(requests[0].url, "https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items", "Should call correct API endpoint");
    
    const requestBody = JSON.parse(requests[0].requestBody);
    assert.equal(requestBody.id, "123", "Should send correct ID");
    assert.equal(requestBody.name, "Test Item", "Should send correct name");
    assert.equal(requestBody.price, 19.99, "Should send correct price");
    
    // Simulate successful response
    requests[0].respond(200, { "Content-Type": "application/json" }, '{"success": true}');
    
    // Form should be cleared
    assert.equal(document.getElementById("item-id").value, "", "ID field should be cleared");
    assert.equal(document.getElementById("item-name").value, "", "Name field should be cleared");
    assert.equal(document.getElementById("item-price").value, "", "Price field should be cleared");
    
    assert.equal(
      document.getElementById("form-status").innerHTML,
      "Item added successfully",
      "Should show success message"
    );
  });
});

// Data Loading tests
QUnit.module('Load Data', function() {
  QUnit.test('Data loads and displays correctly', function(assert) {
    const testData = [
      { id: "1", name: "Test Item 1", price: 9.99 },
      { id: "2", name: "Test Item 2", price: 19.99 }
    ];
    
    loadData();
    
    assert.equal(requests.length, 1, "Should make one GET request");
    assert.equal(requests[0].method, "GET", "Should use GET method");
    assert.equal(requests[0].url, "https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items", "Should call correct API endpoint");
    
    // Simulate successful response with test data
    requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify(testData));
    
    // Check status message
    assert.equal(
      document.getElementById("lambda-info").innerHTML,
      "Data loaded successfully",
      "Should show success message"
    );
    
    // Check that table has the right number of rows
    const tableRows = document.getElementById("inventory-body").querySelectorAll("tr");
    assert.equal(tableRows.length, 2, "Table should have 2 rows");
    
    // Check data in first row
    const firstRow = tableRows[0].querySelectorAll("td");
    assert.equal(firstRow[0].textContent, "1", "First row should have correct ID");
    assert.equal(firstRow[1].textContent, "Test Item 1", "First row should have correct name");
    assert.equal(firstRow[2].textContent, "9.99", "First row should have correct price");
    assert.ok(firstRow[3].querySelector(".delete-btn"), "First row should have a delete button");
  });
  
  QUnit.test('Handles empty data array', function(assert) {
    loadData();
    
    // Simulate empty array response
    requests[0].respond(200, { "Content-Type": "application/json" }, '[]');
    
    const tableRows = document.getElementById("inventory-body").querySelectorAll("tr");
    assert.equal(tableRows.length, 0, "Table should have no rows");
  });
  
  QUnit.test('Handles invalid data response', function(assert) {
    loadData();
    
    // Simulate invalid response (not an array)
    requests[0].respond(200, { "Content-Type": "application/json" }, '{"error": "not an array"}');
    
    assert.equal(
      document.getElementById("lambda-info").innerHTML,
      "Invalid data format received",
      "Should show invalid format message"
    );
  });
  
  QUnit.test('Handles parsing error', function(assert) {
    loadData();
    
    // Simulate invalid JSON response
    requests[0].respond(200, { "Content-Type": "application/json" }, '{not valid json}');
    
    assert.ok(
      document.getElementById("lambda-info").innerHTML.includes("Error parsing data"),
      "Should show parsing error message"
    );
  });
});

// Delete Item tests
QUnit.module('Delete Item', function() {
  QUnit.test('Delete item sends correct request', function(assert) {
    // Setup the DOM with a delete button for an item with ID "1"
    loadData();
    const testData = [{ id: "1", name: "Test Item 1", price: 9.99 }];
    requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify(testData));
    
    // Reset requests array for clarity
    requests = [];
    
    // Now call the delete function directly
    deleteItem("1");
    
    assert.equal(requests.length, 1, "Should make one DELETE request");
    assert.equal(requests[0].method, "DELETE", "Should use DELETE method");
    assert.equal(requests[0].url, "https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items/1", "Should call correct API endpoint with ID");
    
    // Simulate successful response
    requests[0].respond(200, { "Content-Type": "application/json" }, '{"success": true}');
    
    // Should trigger a reload - another request should be made
    assert.equal(requests.length, 2, "Should make a GET request to reload data");
    assert.equal(requests[1].method, "GET", "Second request should be GET");
  });
});

// Additional UI/UX tests
QUnit.module('Display Messages', function() {
  QUnit.test('Error message appears in correct location', function(assert) {
    document.getElementById("form-status").innerHTML = "";
    
    // Trigger validation error
    document.getElementById("item-id").value = "";
    addItem();
    
    assert.equal(
      document.getElementById("form-status").innerHTML,
      "Please fill in all fields",
      "Error message should appear in form-status element"
    );
  });
  
  QUnit.test('Data loading message appears in correct location', function(assert) {
    document.getElementById("lambda-info").innerHTML = "";
    
    loadData();
    requests[0].respond(200, { "Content-Type": "application/json" }, '[]');
    
    assert.equal(
      document.getElementById("lambda-info").innerHTML,
      "Data loaded successfully",
      "Loading message should appear in lambda-info element"
    );
  });
});
