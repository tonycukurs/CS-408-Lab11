window.onload = loaded;

/**
 * Simple Function that will be run when the browser is finished loading.
 */
function loaded() {
    // Assign to a variable so we can set a breakpoint in the debugger!
    const hello = sayHello();
    console.log(hello);
}

/**
 * This function returns the string 'hello'
 * @return {string} the string hello
 */
export function sayHello() {
    return 'hello';
}

/**
 * Add a new inventory item via the API
 */
export function addItem() {
    let itemId = document.getElementById("item-id").value;
    let itemName = document.getElementById("item-name").value;
    let itemPrice = document.getElementById("item-price").value;
    let formStatus = document.getElementById("form-status");
    
    // Simple validation
    if (!itemId || !itemName || !itemPrice) {
        formStatus.innerHTML = "Please fill in all fields";
        return;
    }
    
    let xhr = new XMLHttpRequest();
    xhr.open("PUT", "https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({
        "id": itemId,
        "price": parseFloat(itemPrice),
        "name": itemName
    }));
    
    xhr.onload = function() {
        // Clear the form
        document.getElementById("item-id").value = "";
        document.getElementById("item-name").value = "";
        document.getElementById("item-price").value = "";
        
        // Show success message
        formStatus.innerHTML = "Item added successfully";
        
        // Reload data after sending
        loadData();
    }
    
    xhr.onerror = function() {
        formStatus.innerHTML = "Error adding item: " + xhr.status;
    }
}

/**
 * Load inventory data from the API
 */
export function loadData() {
    let lambda = document.getElementById("lambda-info");
    let tableBody = document.getElementById("inventory-body");
    let xhr = new XMLHttpRequest();
    
    xhr.addEventListener("load", function () {
        lambda.innerHTML = "Data loaded successfully";
        
        // Clear the table first
        tableBody.innerHTML = "";
        
        // Parse the response and populate table
        try {
            const items = JSON.parse(xhr.response);
            
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const row = document.createElement("tr");
                    
                    // ID cell
                    const idCell = document.createElement("td");
                    idCell.textContent = item.id;
                    row.appendChild(idCell);
                    
                    // Name cell
                    const nameCell = document.createElement("td");
                    nameCell.textContent = item.name;
                    row.appendChild(nameCell);
                    
                    // Price cell
                    const priceCell = document.createElement("td");
                    priceCell.textContent = item.price;
                    row.appendChild(priceCell);
                    
                    // Delete button cell
                    const actionCell = document.createElement("td");
                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent = "Delete";
                    deleteBtn.className = "delete-btn";
                    deleteBtn.onclick = function() {
                        deleteItem(item.id);
                    };
                    actionCell.appendChild(deleteBtn);
                    row.appendChild(actionCell);
                    
                    tableBody.appendChild(row);
                });
            } else {
                lambda.innerHTML = "Invalid data format received";
            }
        } catch (e) {
            lambda.innerHTML = "Error parsing data: " + e.message;
        }
    });
    
    xhr.open("GET", "https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items");
    xhr.send();
}

/**
 * Delete an inventory item by ID
 * @param {string} id - The ID of the item to delete
 */
export function deleteItem(id) {
    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", `https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items/${id}`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function() {
        // Reload data after deletion
        loadData();
    }
    xhr.send();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up button click handlers
    document.getElementById("send-data").addEventListener('click', addItem);
    document.getElementById("load-data").addEventListener('click', loadData);
    
    // Load data on page load
    loadData();
});
